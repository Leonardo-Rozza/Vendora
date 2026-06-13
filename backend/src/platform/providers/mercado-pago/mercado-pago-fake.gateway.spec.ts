import { MercadoPagoFakeGateway } from './mercado-pago-fake.gateway';

test('MercadoPagoFakeGateway builds a checkout preference without credentials', async () => {
  const gateway = new MercadoPagoFakeGateway({
    frontendAppUrl: 'https://vendora.example.com',
  } as never);

  const result = await gateway.createCheckoutPreference({
    orderId: 'order-1',
    currencyCode: 'ARS',
    items: [
      { sku: 'sku-1', title: 'Mate', quantity: 2, unitPriceAmount: '12500.00' },
    ],
    payerEmail: 'buyer@example.com',
  });

  expect(result).toEqual({
    provider: 'mercado-pago',
    preferenceId: 'pref_order-1',
    initPoint:
      'https://www.mercadopago.com/checkout/v1/redirect?pref_id=pref_order-1',
    externalReference: 'order-1',
    payerEmail: 'buyer@example.com',
    currencyCode: 'ARS',
    notificationPath: '/api/payments/webhooks/mercado-pago',
    backUrls: {
      success: 'https://vendora.example.com/checkout/success',
      pending: 'https://vendora.example.com/checkout/pending',
      failure: 'https://vendora.example.com/checkout/failure',
    },
    autoReturn: 'approved',
  });
});

test('MercadoPagoFakeGateway echoes the id as an approved payment (dev convention)', async () => {
  const gateway = new MercadoPagoFakeGateway({ frontendAppUrl: null } as never);

  const snapshot = await gateway.getPayment('order-1');

  expect(snapshot).toEqual({
    id: 'order-1',
    status: 'approved',
    externalReference: 'order-1',
  });
});

test('MercadoPagoFakeGateway trusts signatures in development', () => {
  const gateway = new MercadoPagoFakeGateway({ frontendAppUrl: null } as never);

  expect(gateway.verifyWebhookSignature()).toBe(true);
});
