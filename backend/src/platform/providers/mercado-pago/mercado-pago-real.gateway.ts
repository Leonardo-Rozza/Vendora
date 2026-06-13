import { Injectable } from '@nestjs/common';
import MercadoPagoConfig, {
  Payment,
  Preference,
  WebhookSignatureValidator,
} from 'mercadopago';
import { AppConfigService } from '../../config/app-config.service';
import type {
  CheckoutPreference,
  CreateCheckoutPreferenceInput,
  MercadoPagoGateway,
  MercadoPagoPaymentSnapshot,
  MercadoPagoPaymentStatus,
  WebhookSignatureInput,
} from './mercado-pago.gateway';

/** Reject webhooks whose signature timestamp drifts more than this (replay guard). */
const SIGNATURE_TOLERANCE_SECONDS = 300;

/**
 * Production Mercado Pago gateway backed by the official SDK. Selected only when
 * credentials are configured (see ProvidersModule). The access token is read
 * per call from {@link AppConfigService.requireMercadoPagoConfig}, which throws
 * if the capability is not configured.
 */
@Injectable()
export class MercadoPagoRealGateway implements MercadoPagoGateway {
  constructor(private readonly appConfigService: AppConfigService) {}

  private client(): MercadoPagoConfig {
    const { accessToken } = this.appConfigService.requireMercadoPagoConfig();
    return new MercadoPagoConfig({ accessToken });
  }

  async createCheckoutPreference(
    input: CreateCheckoutPreferenceInput,
  ): Promise<CheckoutPreference> {
    const frontendAppUrl = this.appConfigService.frontendAppUrl?.replace(
      /\/$/,
      '',
    );

    const response = await new Preference(this.client()).create({
      body: {
        items: input.items.map((item) => ({
          id: item.sku,
          title: item.title,
          quantity: item.quantity,
          unit_price: Number(item.unitPriceAmount),
          currency_id: input.currencyCode,
        })),
        external_reference: input.orderId,
        ...(input.payerEmail ? { payer: { email: input.payerEmail } } : {}),
        ...(frontendAppUrl
          ? {
              back_urls: {
                success: `${frontendAppUrl}/checkout/success`,
                pending: `${frontendAppUrl}/checkout/pending`,
                failure: `${frontendAppUrl}/checkout/failure`,
              },
              auto_return: 'approved',
            }
          : {}),
      },
    });

    if (!response.id || !response.init_point) {
      throw new Error(
        'Mercado Pago did not return a usable checkout preference',
      );
    }

    return {
      provider: 'mercado-pago',
      preferenceId: response.id,
      initPoint: response.init_point,
      externalReference: input.orderId,
      payerEmail: input.payerEmail,
      currencyCode: input.currencyCode,
      notificationPath: '/api/payments/webhooks/mercado-pago',
      ...(frontendAppUrl
        ? {
            backUrls: {
              success: `${frontendAppUrl}/checkout/success`,
              pending: `${frontendAppUrl}/checkout/pending`,
              failure: `${frontendAppUrl}/checkout/failure`,
            },
            autoReturn: 'approved' as const,
          }
        : {}),
    };
  }

  async getPayment(paymentId: string): Promise<MercadoPagoPaymentSnapshot> {
    const payment = await new Payment(this.client()).get({ id: paymentId });

    return {
      id: String(payment.id ?? paymentId),
      status: mapMercadoPagoStatus(payment.status),
      externalReference: payment.external_reference ?? null,
    };
  }

  verifyWebhookSignature(input: WebhookSignatureInput): boolean {
    const { webhookSecret } = this.appConfigService.requireMercadoPagoConfig();

    try {
      WebhookSignatureValidator.validate({
        xSignature: input.signature,
        xRequestId: input.requestId,
        dataId: input.dataId,
        secret: webhookSecret,
        toleranceSeconds: SIGNATURE_TOLERANCE_SECONDS,
      });
      return true;
    } catch {
      return false;
    }
  }
}

function mapMercadoPagoStatus(
  status: string | undefined,
): MercadoPagoPaymentStatus {
  switch (status) {
    case 'approved':
      return 'approved';
    case 'authorized':
      return 'authorized';
    case 'rejected':
      return 'rejected';
    case 'cancelled':
      return 'cancelled';
    case 'refunded':
    case 'charged_back':
      return 'refunded';
    // 'pending', 'in_process', 'in_mediation', unknown -> not yet final.
    default:
      return 'pending';
  }
}
