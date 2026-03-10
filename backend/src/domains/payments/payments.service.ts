import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { AppLoggerService } from '../../platform/logging/app-logger.service';
import { PrismaService } from '../../platform/prisma/prisma.service';
import { MercadoPagoCheckoutProvider } from '../../platform/providers/mercado-pago/mercado-pago-checkout.provider';

const MERCADO_PAGO_PROVIDER = 'mercado-pago';

type CreateCheckoutPreferenceInput = {
  orderId: string;
  payerEmail?: string;
};

type MercadoPagoWebhookInput = {
  eventId: string;
  resourceId: string;
  topic?: string;
  status?:
    | 'approved'
    | 'authorized'
    | 'pending'
    | 'rejected'
    | 'cancelled'
    | 'refunded';
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
    private readonly mercadoPagoCheckoutProvider: Pick<
      MercadoPagoCheckoutProvider,
      'createCheckoutPreference'
    > = {
      createCheckoutPreference: async () => {
        throw new Error('Mercado Pago checkout provider is not configured');
      },
    },
    private readonly logger: Pick<
      AppLoggerService,
      'logPaymentEvent' | 'logWebhookEvent' | 'logApplicationError'
    > = {
      logPaymentEvent: () => undefined,
      logWebhookEvent: () => undefined,
      logApplicationError: () => undefined,
    },
    private readonly now: () => Date = () => new Date(),
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
      throw new Error(`Order ${input.orderId} was not found`);
    }

    if (order.status === 'PAID' || order.isLocked) {
      throw new Error(`Order ${input.orderId} can no longer be changed`);
    }

    const checkoutPreference =
      await this.mercadoPagoCheckoutProvider.createCheckoutPreference({
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

    let delivery: { id: string };

    try {
      delivery = await this.prisma.paymentWebhookDelivery.create({
        data: {
          provider: MERCADO_PAGO_PROVIDER,
          providerEventId: input.eventId,
          topic: input.topic,
          payload: input,
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

    const payment = await this.prisma.payment.findFirst({
      where: {
        provider: MERCADO_PAGO_PROVIDER,
        providerPaymentId: input.resourceId,
      },
      include: {
        order: true,
      },
    });

    if (!payment) {
      await this.prisma.paymentWebhookDelivery.update({
        where: { id: delivery.id },
        data: {
          processedAt: this.now(),
          status: 'IGNORED',
        },
      });

      return { status: 'ignored' as const };
    }

    const paymentStatus = this.mapWebhookStatus(input.status);
    const processedAt = this.now();

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

    await this.prisma.$transaction(async (transactionClient) => {
      await transactionClient.payment.update({
        where: { id: payment.id },
        data: {
          rawPayload: input,
          status: paymentStatus,
          ...(paymentStatus === 'APPROVED' ? { confirmedAt: processedAt } : {}),
        },
      });

      if (
        paymentStatus === 'APPROVED' &&
        (!payment.order.isLocked || payment.order.status !== 'PAID')
      ) {
        await transactionClient.order.update({
          where: { id: payment.orderId },
          data: {
            isLocked: true,
            paidAt: processedAt,
            status: 'PAID',
          },
        });
      }

      await transactionClient.paymentWebhookDelivery.update({
        where: { id: delivery.id },
        data: {
          paymentId: payment.id,
          processedAt,
          status: 'PROCESSED',
        },
      });
    });

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

  private mapWebhookStatus(status: MercadoPagoWebhookInput['status']): PaymentStatus {
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
}
