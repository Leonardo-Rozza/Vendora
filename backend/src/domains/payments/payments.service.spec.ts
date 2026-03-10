import assert from 'node:assert/strict';
import test from 'node:test';
import { PaymentsService } from './payments.service';

test('PaymentsService loads a payment by provider payment id with webhook deliveries', async () => {
  let receivedArgs: unknown;
  const service = new PaymentsService({
    payment: {
      findFirst: async (args: unknown) => {
        receivedArgs = args;
        return { id: 'payment-1' };
      },
    },
  } as never);

  const result = await service.findByProviderPaymentId('mp-123');

  assert.deepEqual(result, { id: 'payment-1' });
  assert.deepEqual(receivedArgs, {
    where: {
      provider: 'mercado-pago',
      providerPaymentId: 'mp-123',
    },
    include: {
      order: true,
      webhookDeliveries: true,
    },
  });
});
