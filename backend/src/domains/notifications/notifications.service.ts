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
    const message = this.resolveMilestoneMessage(input.milestoneType);
    const trackingUrl = this.resolveTrackingUrl(input.trackingToken);

    const textLines = [
      `Hola ${input.recipientName},`,
      '',
      message,
      input.trackingCode
        ? `Codigo de seguimiento: ${input.trackingCode}.`
        : null,
      input.deliveryReference
        ? `Referencia de entrega: ${input.deliveryReference}.`
        : null,
      trackingUrl ? `Segui tu pedido: ${trackingUrl}` : null,
    ].filter((line): line is string => Boolean(line));

    return {
      subject: `Vendora | ${title}`,
      text: textLines.join('\n'),
      html: this.renderMilestoneEmailHtml({
        title,
        message,
        recipientName: input.recipientName,
        trackingCode: input.trackingCode,
        deliveryReference: input.deliveryReference,
        trackingUrl,
      }),
    };
  }

  private renderMilestoneEmailHtml(input: {
    title: string;
    message: string;
    recipientName: string;
    trackingCode: string | null;
    deliveryReference?: string | null;
    trackingUrl: string | null;
  }): string {
    const name = this.escapeHtml(input.recipientName);
    const title = this.escapeHtml(input.title);
    const message = this.escapeHtml(input.message);

    const detailRow = (label: string, value: string) => `
              <tr>
                <td style="padding:4px 0;font-size:13px;color:#8c847a;">${this.escapeHtml(label)}</td>
                <td style="padding:4px 0;font-size:14px;font-weight:600;color:#1e2022;text-align:right;">${this.escapeHtml(value)}</td>
              </tr>`;

    const details = [
      input.trackingCode
        ? detailRow('Codigo de seguimiento', input.trackingCode)
        : '',
      input.deliveryReference
        ? detailRow('Referencia de entrega', input.deliveryReference)
        : '',
    ].join('');

    const detailsBlock = details
      ? `
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0 0;border-top:1px solid #e6dac6;padding-top:16px;">${details}
            </table>`
      : '';

    const ctaBlock = input.trackingUrl
      ? `
            <table role="presentation" cellpadding="0" cellspacing="0" style="margin:28px 0 0;">
              <tr>
                <td style="border-radius:10px;background:#8c4b26;">
                  <a href="${this.escapeHtml(input.trackingUrl)}" style="display:inline-block;padding:13px 28px;font-size:15px;font-weight:700;color:#fff9f0;text-decoration:none;border-radius:10px;">Ver seguimiento</a>
                </td>
              </tr>
            </table>`
      : '';

    return `<!doctype html>
<html lang="es-AR">
  <body style="margin:0;padding:0;background:#fff9f0;font-family:'Hanken Grotesk',Helvetica,Arial,sans-serif;color:#1e2022;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#fff9f0;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border:1px solid #e6dac6;border-radius:16px;overflow:hidden;">
            <tr>
              <td style="background:#173747;padding:22px 28px;">
                <table role="presentation" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="width:36px;height:36px;background:#8c4b26;border-radius:9px;text-align:center;vertical-align:middle;font-size:18px;font-weight:800;color:#fff9f0;">V</td>
                    <td style="padding-left:10px;font-size:18px;font-weight:800;color:#fbefd9;">Vendora</td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding:32px 28px;">
                <p style="margin:0 0 4px;font-size:12px;letter-spacing:0.12em;text-transform:uppercase;color:#8c4b26;font-weight:700;">Actualizacion de tu pedido</p>
                <h1 style="margin:0 0 18px;font-size:24px;line-height:1.2;color:#1e2022;">${title}</h1>
                <p style="margin:0 0 12px;font-size:15px;color:#1e2022;">Hola ${name},</p>
                <p style="margin:0;font-size:15px;line-height:1.55;color:#5b554e;">${message}</p>
                ${detailsBlock}
                ${ctaBlock}
              </td>
            </tr>
            <tr>
              <td style="background:#173747;padding:18px 28px;font-size:12px;color:#9fb6be;">
                Vendora · Envios a AMBA · Pagos con Mercado Pago
              </td>
            </tr>
          </table>
          <p style="max-width:520px;margin:16px auto 0;font-size:11px;color:#b7ae9f;text-align:center;">Recibis este correo porque realizaste un pedido en Vendora.</p>
        </td>
      </tr>
    </table>
  </body>
</html>`;
  }

  private escapeHtml(value: string): string {
    return value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  private resolveMilestoneMessage(type: OrderMilestoneType): string {
    switch (type) {
      case OrderMilestoneType.PAYMENT_CONFIRMED:
        return 'Confirmamos el pago de tu pedido y ya lo estamos preparando para el envio.';
      case OrderMilestoneType.OUT_FOR_DELIVERY:
        return 'Tu pedido salio a reparto y esta en camino a la direccion indicada.';
      case OrderMilestoneType.DELIVERED:
        return 'Tu pedido fue entregado. Gracias por comprar en Vendora.';
      default:
        return 'Tenemos una actualizacion sobre el estado de tu pedido.';
    }
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
