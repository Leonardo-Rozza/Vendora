import assert from 'node:assert/strict';
import test from 'node:test';
import { PaymentsController } from './payments.controller';

test('PaymentsController returns the checkout preference contract', async () => {
  const controller = new PaymentsController({
    createCheckoutPreference: async (input: unknown) => ({
      ...(input as { orderId: string; payerEmail?: string }),
      paymentId: 'payment-1',
      provider: 'mercado-pago',
      preferenceId: 'pref_order-1',
      initPoint: 'https://www.mercadopago.com/checkout/v1/redirect?pref_id=pref_order-1',
    }),
  } as never);

  const result = await controller.createCheckoutPreference({
    orderId: 'order-1',
    payerEmail: 'buyer@example.com',
  });

  assert.deepEqual(result, {
    orderId: 'order-1',
    payerEmail: 'buyer@example.com',
    paymentId: 'payment-1',
    provider: 'mercado-pago',
    preferenceId: 'pref_order-1',
    initPoint: 'https://www.mercadopago.com/checkout/v1/redirect?pref_id=pref_order-1',
  });
});

test('PaymentsController acknowledges duplicate webhook deliveries', async () => {
  const controller = new PaymentsController({
    handleMercadoPagoWebhook: async () => ({
      status: 'duplicate',
    }),
  } as never);

  const result = await controller.handleMercadoPagoWebhook({
    eventId: 'evt-1',
    resourceId: 'payment-1',
    status: 'approved',
    topic: 'payment',
  });

  assert.deepEqual(result, {
    status: 'duplicate',
  });
});
