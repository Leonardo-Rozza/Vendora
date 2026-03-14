import { Injectable } from '@nestjs/common';
import { NotificationChannel, OrderMilestoneType } from '@prisma/client';
import { AppConfigService } from '../../platform/config/app-config.service';
import { AppLoggerService } from '../../platform/logging/app-logger.service';
import { PrismaService } from '../../platform/prisma/prisma.service';
import {
  EmailNotificationProvider,
  type SendEmailNotificationInput,
} from './providers/email-notification.provider';

export type SendOrderMilestoneEmailInput = SendEmailNotificationInput & {
  orderId: string;
  milestoneType: string;
};

export type SendOrderMilestoneEmailResult = {
  channel: 'email';
  status: 'sent' | 'skipped' | 'failed';
  provider: 'resend-compatible';
  providerMessageId?: string;
  errorMessage?: string;
};

export type DispatchMilestoneNotificationInput = {
  orderId: string;
  milestoneId: string;
  milestoneType: OrderMilestoneType;
  trackingToken: string | null;
  trackingCode: string | null;
  recipientEmail: string;
  recipientName: string;
  deliveryReference?: string | null;
};

@Injectable()
export class NotificationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly appConfigService: AppConfigService,
    private readonly emailNotificationProvider: EmailNotificationProvider,
    private readonly logger: AppLoggerService,
  ) {}

  async dispatchMilestoneNotification(
    input: DispatchMilestoneNotificationInput,
  ) {
    const existingDelivery = await this.prisma.notificationDelivery.findFirst({
      where: {
        milestoneId: input.milestoneId,
        channel: NotificationChannel.EMAIL,
      },
    });

    if (existingDelivery) {
      return {
        channel: 'email' as const,
        status: 'skipped' as const,
        provider: 'resend-compatible' as const,
      };
    }

    const payload = this.buildMilestoneEmailPayload(input);
    const delivery = await this.prisma.notificationDelivery.create({
      data: {
        orderId: input.orderId,
        milestoneId: input.milestoneId,
        channel: NotificationChannel.EMAIL,
        recipient: input.recipientEmail,
        provider: 'resend-compatible',
        payload,
      },
    });

    const result = await this.sendOrderMilestoneEmail({
      orderId: input.orderId,
      milestoneType: input.milestoneType,
      to: input.recipientEmail,
      subject: payload.subject,
      html: payload.html,
      text: payload.text,
    });

    await this.prisma.notificationDelivery.update({
      where: { id: delivery.id },
      data: {
        status: this.mapResultStatus(result.status),
        providerMessageId: result.providerMessageId,
        errorMessage: result.errorMessage,
        sentAt: result.status === 'sent' ? new Date() : null,
        failedAt: result.status === 'failed' ? new Date() : null,
      },
    });

    return result;
  }

  async sendOrderMilestoneEmail(
    input: SendOrderMilestoneEmailInput,
  ): Promise<SendOrderMilestoneEmailResult> {
    try {
      const result = await this.emailNotificationProvider.send(input);

      this.logger.logApplicationEvent('notification.email.processed', {
        orderId: input.orderId,
        milestoneType: input.milestoneType,
        recipient: input.to,
        status: result.status,
        provider: result.provider,
        providerMessageId: result.providerMessageId,
      });

      return {
        channel: 'email',
        status: result.status,
        provider: result.provider,
        providerMessageId: result.providerMessageId,
      };
    } catch (error) {
      const resolvedError =
        error instanceof Error ? error : new Error(String(error));

      this.logger.logApplicationError(
        'notification.email.failed',
        resolvedError,
        {
          orderId: input.orderId,
          milestoneType: input.milestoneType,
          recipient: input.to,
        },
      );

      return {
        channel: 'email',
        status: 'failed',
        provider: 'resend-compatible',
        errorMessage: resolvedError.message,
      };
    }
  }

  private buildMilestoneEmailPayload(
    input: DispatchMilestoneNotificationInput,
  ) {
    const title = this.resolveMilestoneTitle(input.milestoneType);
    const trackingUrl = this.resolveTrackingUrl(input.trackingToken);
    const lines = [
      `Hola ${input.recipientName},`,
      '',
      `${title}.`,
      input.trackingCode
        ? `Codigo de seguimiento: ${input.trackingCode}.`
        : null,
      input.deliveryReference
        ? `Referencia de entrega: ${input.deliveryReference}.`
        : null,
      trackingUrl ? `Seguimiento: ${trackingUrl}` : null,
    ].filter((line): line is string => Boolean(line));

    return {
      subject: `Vendora | ${title}`,
      text: lines.join('\n'),
      html: `<p>${lines.join('</p><p>')}</p>`,
    };
  }

  private resolveTrackingUrl(trackingToken: string | null) {
    const frontendBaseUrl = this.appConfigService.frontendAppUrl?.replace(
      /\/$/,
      '',
    );

    if (!trackingToken || !frontendBaseUrl) {
      return null;
    }

    return `${frontendBaseUrl}/seguimiento/${trackingToken}`;
  }

  private resolveMilestoneTitle(type: OrderMilestoneType) {
    switch (type) {
      case OrderMilestoneType.PAYMENT_CONFIRMED:
        return 'Pago confirmado';
      case OrderMilestoneType.OUT_FOR_DELIVERY:
        return 'Tu pedido esta en camino';
      case OrderMilestoneType.DELIVERED:
        return 'Tu pedido fue entregado';
      default:
        return 'Actualizacion de tu pedido';
    }
  }

  private mapResultStatus(result: SendOrderMilestoneEmailResult['status']) {
    switch (result) {
      case 'sent':
        return 'SENT' as const;
      case 'failed':
        return 'FAILED' as const;
      default:
        return 'SKIPPED' as const;
    }
  }
}
