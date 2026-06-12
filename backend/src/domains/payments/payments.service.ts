import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
  Optional,
  UnauthorizedException,
} from '@nestjs/common';
import { OrderMilestoneType, Prisma } from '@prisma/client';
import { InventoryService } from '../inventory/inventory.service';
import { NotificationsService } from '../notifications/notifications.service';
import { AppLoggerService } from '../../platform/logging/app-logger.service';
import { PrismaService } from '../../platform/prisma/prisma.service';
import {
  MERCADO_PAGO_GATEWAY,
  type MercadoPagoGateway,
  type MercadoPagoPaymentStatus,
} from '../../platform/providers/mercado-pago/mercado-pago.gateway';
import {
  createMilestoneContent,
  shouldSendNotificationForMilestone,
} from '../orders/order-tracking.mapper';

const MERCADO_PAGO_PROVIDER = 'mercado-pago';

type CreateCheckoutPreferenceInput = {
  orderId: string;
  payerEmail?: string;
};

type MercadoPagoWebhookInput = {
  eventId: string;
  resourceId: string;
  topic?: string;
  /** Raw `x-signature` header, used to authenticate the notification. */
  signature?: string;
  /** Raw `x-request-id` header, part of the signed manifest. */
  requestId?: string;
};

type PaymentStatus =
  | 'PENDING'
  | 'AUTHORIZED'
  | 'APPROVED'
  | 'REJECTED'
  | 'CANCELLED'
  | 'REFUNDED';

@Injectable()
export class PaymentsService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(MERCADO_PAGO_GATEWAY)
    private readonly mercadoPagoGateway: MercadoPagoGateway,
    private readonly logger: AppLoggerService,
    private readonly inventoryService: InventoryService,
    @Optional()
    private readonly notificationsService?: NotificationsService,
  ) {}

  findByProviderPaymentId(providerPaymentId: string) {
    return this.prisma.payment.findFirst({
      where: {
        provider: MERCADO_PAGO_PROVIDER,
        providerPaymentId,
      },
      include: {
        order: true,
        webhookDeliveries: true,
      },
    });
  }

  async createCheckoutPreference(input: CreateCheckoutPreferenceInput) {
    const order = await this.prisma.order.findUnique({
      where: { id: input.orderId },
      include: {
        items: true,
        payments: true,
      },
    });

    if (!order) {
      throw new NotFoundException(`Order ${input.orderId} was not found`);
    }

    if (order.status === 'PAID' || order.isLocked) {
      throw new ConflictException(
        `Order ${input.orderId} can no longer be changed`,
      );
    }

    const checkoutPreference =
      await this.mercadoPagoGateway.createCheckoutPreference({
        orderId: order.id,
        currencyCode: order.currencyCode,
        payerEmail: input.payerEmail,
        items: order.items.map((item) => ({
          sku: item.sku,
          title: item.productName,
          quantity: item.quantity,
          unitPriceAmount: item.unitPriceAmount.toString(),
        })),
      });

    const payment = await this.prisma.payment.create({
      data: {
        orderId: order.id,
        provider: MERCADO_PAGO_PROVIDER,
        providerPreferenceId: checkoutPreference.preferenceId,
        rawPayload: checkoutPreference,
        status: 'PENDING',
      },
    });

    this.logger.logPaymentEvent('payment.checkout_preference.created', {
      orderId: order.id,
      paymentId: payment.id,
      preferenceId: checkoutPreference.preferenceId,
    });

    return {
      orderId: order.id,
      paymentId: payment.id,
      provider: checkoutPreference.provider,
      preferenceId: checkoutPreference.preferenceId,
      initPoint: checkoutPreference.initPoint,
      payerEmail: input.payerEmail,
    };
  }

  async handleMercadoPagoWebhook(input: MercadoPagoWebhookInput) {
    this.logger.logWebhookEvent('payment.webhook.received', {
      eventId: input.eventId,
      resourceId: input.resourceId,
      topic: input.topic,
    });

    // Authenticate the notification before doing anything else: an unverifiable
    // webhook is rejected outright.
    const isSignatureValid = this.mercadoPagoGateway.verifyWebhookSignature({
      dataId: input.resourceId,
      signature: input.signature,
      requestId: input.requestId,
    });

    if (!isSignatureValid) {
      this.logger.logWebhookEvent('payment.webhook.invalid_signature', {
        eventId: input.eventId,
        resourceId: input.resourceId,
      });

      throw new UnauthorizedException('Invalid Mercado Pago webhook signature');
    }

    let delivery: { id: string };

    try {
      delivery = await this.prisma.paymentWebhookDelivery.create({
        data: {
          provider: MERCADO_PAGO_PROVIDER,
          providerEventId: input.eventId,
          topic: input.topic,
          payload: {
            eventId: input.eventId,
            resourceId: input.resourceId,
            topic: input.topic ?? null,
          },
          status: 'PROCESSING',
        },
      });
    } catch (error) {
      if (this.isDuplicateWebhook(error)) {
        this.logger.logWebhookEvent('payment.webhook.duplicate', {
          eventId: input.eventId,
        });

        return { status: 'duplicate' as const };
      }

      throw error;
    }

    // Fetch the AUTHORITATIVE payment state from Mercado Pago — the request
    // body never dictates the status.
    const snapshot = await this.mercadoPagoGateway.getPayment(input.resourceId);

    const payment = await this.findPaymentForWebhook(
      input.resourceId,
      snapshot.externalReference,
    );

    if (!payment) {
      await this.prisma.paymentWebhookDelivery.update({
        where: { id: delivery.id },
        data: {
          processedAt: this.getNow(),
          status: 'IGNORED',
        },
      });

      return { status: 'ignored' as const };
    }

    const paymentStatus = this.mapWebhookStatus(snapshot.status);
    const processedAt = this.getNow();

    if (!this.shouldApplyWebhookStatus(payment.status, paymentStatus)) {
      await this.prisma.paymentWebhookDelivery.update({
        where: { id: delivery.id },
        data: {
          paymentId: payment.id,
          processedAt,
          status: 'IGNORED',
        },
      });

      this.logger.logWebhookEvent('payment.webhook.ignored_transition', {
        eventId: input.eventId,
        orderId: payment.orderId,
        paymentId: payment.id,
        currentStatus: payment.status,
        attemptedStatus: paymentStatus,
      });

      return {
        status: 'ignored' as const,
        orderId: payment.orderId,
        paymentId: payment.id,
        paymentStatus: payment.status,
      };
    }

    const notificationContext = await this.prisma.$transaction(
      async (transactionClient) => {
        let nextNotificationContext: {
          orderId: string;
          milestoneId: string;
          milestoneType: OrderMilestoneType;
          trackingToken: string | null;
          trackingCode: string | null;
          recipientEmail: string;
          recipientName: string;
          deliveryReference: string | null;
        } | null = null;

        await transactionClient.payment.update({
          where: { id: payment.id },
          data: {
            providerPaymentId: input.resourceId,
            rawPayload: snapshot,
            status: paymentStatus,
            ...(paymentStatus === 'APPROVED'
              ? { confirmedAt: processedAt }
              : {}),
          },
        });

        if (
          paymentStatus === 'APPROVED' &&
          (!payment.order.isLocked || payment.order.status !== 'PAID')
        ) {
          await this.inventoryService.consumeReservationForOrder(
            transactionClient,
            payment.orderId,
          );

          const updatedOrder = await transactionClient.order.update({
            where: { id: payment.orderId },
            data: {
              isLocked: true,
              paidAt: processedAt,
              status: 'PAID',
            },
          });

          const milestone = await transactionClient.orderMilestone.create({
            data: {
              orderId: payment.orderId,
              type: OrderMilestoneType.PAYMENT_CONFIRMED,
              ...createMilestoneContent(OrderMilestoneType.PAYMENT_CONFIRMED),
            },
          });

          nextNotificationContext = {
            orderId: payment.orderId,
            milestoneId: milestone.id,
            milestoneType: milestone.type,
            trackingToken: payment.order.trackingToken,
            trackingCode: payment.order.trackingCode,
            recipientEmail: payment.order.contactEmail,
            recipientName: payment.order.contactFullName,
            deliveryReference: updatedOrder.deliveryReference,
          };
        }

        await transactionClient.paymentWebhookDelivery.update({
          where: { id: delivery.id },
          data: {
            paymentId: payment.id,
            processedAt,
            status: 'PROCESSED',
          },
        });

        return nextNotificationContext;
      },
    );

    if (
      notificationContext &&
      this.notificationsService &&
      shouldSendNotificationForMilestone(notificationContext.milestoneType)
    ) {
      await this.notificationsService.dispatchMilestoneNotification(
        notificationContext,
      );
    }

    this.logger.logPaymentEvent('payment.webhook.processed', {
      eventId: input.eventId,
      orderId: payment.orderId,
      paymentId: payment.id,
      paymentStatus,
    });

    return {
      status: 'processed' as const,
      orderId: payment.orderId,
      paymentId: payment.id,
      paymentStatus,
    };
  }

  private isDuplicateWebhook(error: unknown): boolean {
    return (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    );
  }

  /**
   * Locates our payment record for an incoming webhook: first by the Mercado
   * Pago payment id (set on a prior notification), then by the order id carried
   * in `external_reference` (the first notification links the two).
   */
  private async findPaymentForWebhook(
    providerPaymentId: string,
    externalReference: string | null,
  ) {
    const byPaymentId = await this.prisma.payment.findFirst({
      where: {
        provider: MERCADO_PAGO_PROVIDER,
        providerPaymentId,
      },
      include: { order: true },
    });

    if (byPaymentId || !externalReference) {
      return byPaymentId;
    }

    return this.prisma.payment.findFirst({
      where: {
        provider: MERCADO_PAGO_PROVIDER,
        orderId: externalReference,
      },
      include: { order: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  private mapWebhookStatus(status: MercadoPagoPaymentStatus): PaymentStatus {
    switch (status) {
      case 'approved':
        return 'APPROVED';
      case 'authorized':
        return 'AUTHORIZED';
      case 'rejected':
        return 'REJECTED';
      case 'cancelled':
        return 'CANCELLED';
      case 'refunded':
        return 'REFUNDED';
      default:
        return 'PENDING';
    }
  }

  private shouldApplyWebhookStatus(
    currentStatus: PaymentStatus,
    nextStatus: PaymentStatus,
  ): boolean {
    if (currentStatus === nextStatus) {
      return !this.isTerminalPaymentStatus(currentStatus);
    }

    if (currentStatus === 'APPROVED') {
      return nextStatus === 'REFUNDED';
    }

    if (this.isTerminalPaymentStatus(currentStatus)) {
      return false;
    }

    return true;
  }

  private isTerminalPaymentStatus(status: PaymentStatus): boolean {
    return (
      status === 'APPROVED' ||
      status === 'REJECTED' ||
      status === 'CANCELLED' ||
      status === 'REFUNDED'
    );
  }

  protected getNow(): Date {
    return new Date();
  }
}
