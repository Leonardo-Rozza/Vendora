import assert from 'node:assert/strict';
import test from 'node:test';
import {
  ConfigurationUnavailableError,
  type CapabilityStatus,
} from '../../config/app-config.service';
import { MercadoPagoCheckoutProvider } from './mercado-pago-checkout.provider';

test('MercadoPagoCheckoutProvider creates a foundation checkout preference contract', async () => {
  const provider = new MercadoPagoCheckoutProvider({
    requireMercadoPagoConfig: () => ({
      accessToken: 'token',
      webhookSecret: 'secret',
    }),
  } as never);

  const result = await provider.createCheckoutPreference({
    orderId: 'order-1',
    currencyCode: 'ARS',
    items: [
      {
        sku: 'sku-1',
        title: 'Mate',
        quantity: 2,
        unitPriceAmount: '12500.00',
      },
    ],
    payerEmail: 'buyer@example.com',
  });

  assert.deepEqual(result, {
    provider: 'mercado-pago',
    preferenceId: 'pref_order-1',
    initPoint:
      'https://www.mercadopago.com/checkout/v1/redirect?pref_id=pref_order-1',
    externalReference: 'order-1',
    payerEmail: 'buyer@example.com',
    currencyCode: 'ARS',
    notificationPath: '/api/payments/webhooks/mercado-pago',
  });
});

test('MercadoPagoCheckoutProvider fails when Mercado Pago is unavailable', async () => {
  const provider = new MercadoPagoCheckoutProvider({
    requireMercadoPagoConfig: () => {
      throw new ConfigurationUnavailableError(
        'mercadoPago',
        'Missing credentials',
      );
    },
    mercadoPagoStatus: {
      configured: false,
      reason: 'Missing credentials',
    } as CapabilityStatus,
  } as never);

  await assert.rejects(
    () =>
      provider.createCheckoutPreference({
        orderId: 'order-1',
        currencyCode: 'ARS',
        items: [],
      }),
    /mercadoPago is not configured/,
  );
});
