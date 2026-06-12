import { Injectable } from '@nestjs/common';
import { AppConfigService } from '../../config/app-config.service';
import type {
  CheckoutPreference,
  CreateCheckoutPreferenceInput,
  MercadoPagoGateway,
  MercadoPagoPaymentSnapshot,
} from './mercado-pago.gateway';

/**
 * Local / "dry-run" Mercado Pago gateway used when no credentials are
 * configured. It lets the checkout and webhook flows run end-to-end during
 * development WITHOUT contacting Mercado Pago.
 *
 * Dev convention: trigger the webhook with `resourceId` set to the order id —
 * {@link getPayment} echoes it back as `externalReference` so the service can
 * match the order, and reports it as `approved` to simulate a paid order.
 */
@Injectable()
export class MercadoPagoFakeGateway implements MercadoPagoGateway {
  constructor(private readonly appConfigService: AppConfigService) {}

  createCheckoutPreference(
    input: CreateCheckoutPreferenceInput,
  ): Promise<CheckoutPreference> {
    const preferenceId = `pref_${input.orderId}`;
    const frontendAppUrl = this.appConfigService.frontendAppUrl?.replace(
      /\/$/,
      '',
    );

    return Promise.resolve({
      provider: 'mercado-pago',
      preferenceId,
      initPoint: `https://www.mercadopago.com/checkout/v1/redirect?pref_id=${preferenceId}`,
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
    });
  }

  getPayment(paymentId: string): Promise<MercadoPagoPaymentSnapshot> {
    // No real Mercado Pago to query: simulate an approved payment whose
    // external_reference is the id we were given (see the dev convention above).
    return Promise.resolve({
      id: paymentId,
      status: 'approved',
      externalReference: paymentId,
    });
  }

  verifyWebhookSignature(): boolean {
    // Development has no real Mercado Pago signatures to verify.
    return true;
  }
}
