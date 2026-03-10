import { Injectable } from '@nestjs/common';
import { AppConfigService } from '../../config/app-config.service';

export type CheckoutPreferenceItem = {
  sku: string;
  title: string;
  quantity: number;
  unitPriceAmount: string;
};

export type CreateCheckoutPreferenceInput = {
  orderId: string;
  currencyCode: string;
  items: CheckoutPreferenceItem[];
  payerEmail?: string;
};

export type CheckoutPreference = {
  provider: 'mercado-pago';
  preferenceId: string;
  initPoint: string;
  externalReference: string;
  payerEmail?: string;
  currencyCode: string;
  notificationPath: string;
};

@Injectable()
export class MercadoPagoCheckoutProvider {
  constructor(private readonly appConfigService: AppConfigService) {}

  async createCheckoutPreference(
    input: CreateCheckoutPreferenceInput,
  ): Promise<CheckoutPreference> {
    this.appConfigService.requireMercadoPagoConfig();

    const preferenceId = `pref_${input.orderId}`;

    return {
      provider: 'mercado-pago',
      preferenceId,
      initPoint: `https://www.mercadopago.com/checkout/v1/redirect?pref_id=${preferenceId}`,
      externalReference: input.orderId,
      payerEmail: input.payerEmail,
      currencyCode: input.currencyCode,
      notificationPath: '/api/payments/webhooks/mercado-pago',
    };
  }
}
