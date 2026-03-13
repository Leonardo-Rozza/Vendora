import assert from 'node:assert/strict';
import test from 'node:test';
import { Prisma } from '@prisma/client';
import { PaymentsService } from './payments.service';

const noopCheckoutProvider = {
  createCheckoutPreference: async () => {
    throw new Error('not used');
  },
} as never;

const noopLogger = {
  logPaymentEvent: () => undefined,
  logWebhookEvent: () => undefined,
  logApplicationError: () => undefined,
} as never;

const noopInventoryService = {
  consumeReservationForOrder: async () => undefined,
} as never;

const withFixedNow = (service: PaymentsService, now: Date) => {
  Object.defineProperty(service, 'getNow', {
    value: () => now,
  });

  return service;
};

test('PaymentsService loads a payment by provider payment id with webhook deliveries', async () => {
  let receivedArgs: unknown;
  const service = new PaymentsService(
    {
      payment: {
        findFirst: async (args: unknown) => {
          receivedArgs = args;
          return { id: 'payment-1' };
        },
      },
    } as never,
    noopCheckoutProvider,
    noopLogger,
    noopInventoryService,
  );

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

test('PaymentsService creates a Mercado Pago checkout preference for an unpaid order', async () => {
  const calls: { orderFind?: unknown; paymentCreate?: unknown } = {};
  const paymentLogs: Array<{ event: string; payload: unknown }> = [];
  const service = new PaymentsService(
    {
      order: {
        findUnique: async (args: unknown) => {
          calls.orderFind = args;
          return {
            id: 'order-1',
            status: 'PENDING_PAYMENT',
            isLocked: false,
            currencyCode: 'ARS',
            items: [
              {
                sku: 'SKU-1',
                productName: 'Mate',
                quantity: 2,
                unitPriceAmount: {
                  toString: () => '12500.00',
                },
              },
            ],
            payments: [],
          };
        },
      },
      payment: {
        create: async (args: unknown) => {
          calls.paymentCreate = args;
          return {
            id: 'payment-1',
          };
        },
      },
      paymentWebhookDelivery: {},
    } as never,
    {
      createCheckoutPreference: async () => ({
        provider: 'mercado-pago',
        preferenceId: 'pref_order-1',
        initPoint:
          'https://www.mercadopago.com/checkout/v1/redirect?pref_id=pref_order-1',
        externalReference: 'order-1',
        payerEmail: 'buyer@example.com',
        currencyCode: 'ARS',
        notificationPath: '/api/payments/webhooks/mercado-pago',
      }),
    } as never,
    {
      logPaymentEvent: (event: string, payload: unknown) => {
        paymentLogs.push({ event, payload });
      },
      logWebhookEvent: () => undefined,
      logApplicationError: () => undefined,
    } as never,
    {
      consumeReservationForOrder: async () => undefined,
    } as never,
  );

  const result = await service.createCheckoutPreference({
    orderId: 'order-1',
    payerEmail: 'buyer@example.com',
  });

  assert.deepEqual(result, {
    orderId: 'order-1',
    paymentId: 'payment-1',
    provider: 'mercado-pago',
    preferenceId: 'pref_order-1',
    initPoint:
      'https://www.mercadopago.com/checkout/v1/redirect?pref_id=pref_order-1',
    payerEmail: 'buyer@example.com',
  });
  assert.deepEqual(calls.orderFind, {
    where: { id: 'order-1' },
    include: {
      items: true,
      payments: true,
    },
  });
  assert.deepEqual(calls.paymentCreate, {
    data: {
      orderId: 'order-1',
      provider: 'mercado-pago',
      providerPreferenceId: 'pref_order-1',
      rawPayload: {
        currencyCode: 'ARS',
        externalReference: 'order-1',
        initPoint:
          'https://www.mercadopago.com/checkout/v1/redirect?pref_id=pref_order-1',
        notificationPath: '/api/payments/webhooks/mercado-pago',
        payerEmail: 'buyer@example.com',
        preferenceId: 'pref_order-1',
        provider: 'mercado-pago',
      },
      status: 'PENDING',
    },
  });
  assert.deepEqual(paymentLogs, [
    {
      event: 'payment.checkout_preference.created',
      payload: {
        orderId: 'order-1',
        paymentId: 'payment-1',
        preferenceId: 'pref_order-1',
      },
    },
  ]);
});

test('PaymentsService deduplicates repeated Mercado Pago webhook deliveries', async () => {
  const service = new PaymentsService(
    {
      $transaction: async () => {
        throw new Error('not used');
      },
      payment: {
        findFirst: async () => ({
          id: 'payment-1',
        }),
      },
      paymentWebhookDelivery: {
        create: async () => {
          throw new Prisma.PrismaClientKnownRequestError('duplicate webhook', {
            code: 'P2002',
            clientVersion: 'test',
          });
        },
      },
    } as never,
    {
      createCheckoutPreference: async () => {
        throw new Error('not used');
      },
    } as never,
    {
      logPaymentEvent: () => undefined,
      logWebhookEvent: () => undefined,
      logApplicationError: () => undefined,
    } as never,
    {
      consumeReservationForOrder: async () => undefined,
    } as never,
  );

  const result = await service.handleMercadoPagoWebhook({
    eventId: 'evt-1',
    resourceId: 'mp-123',
    status: 'approved',
    topic: 'payment',
  });

  assert.deepEqual(result, {
    status: 'duplicate',
  });
});

test('PaymentsService locks the order when an approved webhook is processed', async () => {
  const calls: Record<string, unknown> = {};
  const paymentLogs: Array<{ event: string; payload: unknown }> = [];
  const inventoryCalls: Array<{ client: unknown; orderId: string }> = [];
  const now = new Date('2024-01-01T00:00:00.000Z');
  const transactionClient = {
    payment: {
      update: async (args: unknown) => {
        calls.paymentUpdate = args;
        return {
          id: 'payment-1',
          status: 'APPROVED',
        };
      },
    },
    order: {
      update: async (args: unknown) => {
        calls.orderUpdate = args;
        return args;
      },
    },
    paymentWebhookDelivery: {
      update: async (args: unknown) => {
        calls.deliveryUpdate = args;
        return args;
      },
    },
  };
  const service = withFixedNow(
    new PaymentsService(
      {
        $transaction: async (
          callback: (client: typeof transactionClient) => Promise<unknown>,
        ) => callback(transactionClient),
        paymentWebhookDelivery: {
          create: async (args: unknown) => {
            calls.deliveryCreate = args;
            return { id: 'delivery-1' };
          },
        },
        payment: {
          findFirst: async (args: unknown) => {
            calls.paymentFind = args;
            return {
              id: 'payment-1',
              orderId: 'order-1',
              status: 'PENDING',
              order: {
                id: 'order-1',
                status: 'PENDING_PAYMENT',
                isLocked: false,
              },
            };
          },
        },
      } as never,
      {
        createCheckoutPreference: async () => {
          throw new Error('not used');
        },
      } as never,
      {
        logPaymentEvent: (event: string, payload: unknown) => {
          paymentLogs.push({ event, payload });
        },
        logWebhookEvent: () => undefined,
        logApplicationError: () => undefined,
      } as never,
      {
        consumeReservationForOrder: async (
          client: unknown,
          orderId: string,
        ) => {
          inventoryCalls.push({ client, orderId });
        },
      } as never,
    ),
    now,
  );

  const result = await service.handleMercadoPagoWebhook({
    eventId: 'evt-1',
    resourceId: 'mp-123',
    status: 'approved',
    topic: 'payment',
  });

  assert.deepEqual(result, {
    status: 'processed',
    orderId: 'order-1',
    paymentId: 'payment-1',
    paymentStatus: 'APPROVED',
  });
  assert.deepEqual(calls.paymentFind, {
    where: {
      provider: 'mercado-pago',
      providerPaymentId: 'mp-123',
    },
    include: {
      order: true,
    },
  });
  assert.deepEqual(calls.orderUpdate, {
    where: { id: 'order-1' },
    data: {
      isLocked: true,
      paidAt: now,
      status: 'PAID',
    },
  });
  assert.deepEqual(paymentLogs, [
    {
      event: 'payment.webhook.processed',
      payload: {
        eventId: 'evt-1',
        orderId: 'order-1',
        paymentId: 'payment-1',
        paymentStatus: 'APPROVED',
      },
    },
  ]);
  assert.equal(inventoryCalls.length, 1);
  assert.equal(inventoryCalls[0]?.orderId, 'order-1');
});

test('PaymentsService ignores duplicate approved webhooks after the payment is already terminal', async () => {
  const calls: Record<string, unknown> = {};
  const now = new Date('2024-01-02T00:00:00.000Z');
  const service = withFixedNow(
    new PaymentsService(
      {
        $transaction: async () => {
          throw new Error('not used');
        },
        paymentWebhookDelivery: {
          create: async (args: unknown) => {
            calls.deliveryCreate = args;
            return { id: 'delivery-1' };
          },
          update: async (args: unknown) => {
            calls.deliveryUpdate = args;
            return args;
          },
        },
        payment: {
          findFirst: async () => ({
            id: 'payment-1',
            orderId: 'order-1',
            status: 'APPROVED',
            order: {
              id: 'order-1',
              status: 'PAID',
              isLocked: true,
            },
          }),
          update: async (args: unknown) => {
            calls.paymentUpdate = args;
            return args;
          },
        },
        order: {
          update: async (args: unknown) => {
            calls.orderUpdate = args;
            return args;
          },
        },
      } as never,
      {
        createCheckoutPreference: async () => {
          throw new Error('not used');
        },
      } as never,
      {
        logPaymentEvent: () => undefined,
        logWebhookEvent: () => undefined,
        logApplicationError: () => undefined,
      } as never,
      {
        consumeReservationForOrder: async () => undefined,
      } as never,
    ),
    now,
  );

  const result = await service.handleMercadoPagoWebhook({
    eventId: 'evt-duplicate-approved',
    resourceId: 'mp-123',
    status: 'approved',
    topic: 'payment',
  });

  assert.deepEqual(result, {
    status: 'ignored',
    orderId: 'order-1',
    paymentId: 'payment-1',
    paymentStatus: 'APPROVED',
  });
  assert.equal(calls.paymentUpdate, undefined);
  assert.equal(calls.orderUpdate, undefined);
  assert.deepEqual(calls.deliveryUpdate, {
    where: { id: 'delivery-1' },
    data: {
      paymentId: 'payment-1',
      processedAt: now,
      status: 'IGNORED',
    },
  });
});

test('PaymentsService ignores stale webhook regressions after payment approval', async () => {
  const calls: Record<string, unknown> = {};
  const webhookLogs: Array<{ event: string; payload: unknown }> = [];
  const now = new Date('2024-01-03T00:00:00.000Z');
  const service = withFixedNow(
    new PaymentsService(
      {
        $transaction: async () => {
          throw new Error('not used');
        },
        paymentWebhookDelivery: {
          create: async () => ({ id: 'delivery-1' }),
          update: async (args: unknown) => {
            calls.deliveryUpdate = args;
            return args;
          },
        },
        payment: {
          findFirst: async () => ({
            id: 'payment-1',
            orderId: 'order-1',
            status: 'APPROVED',
            order: {
              id: 'order-1',
              status: 'PAID',
              isLocked: true,
            },
          }),
          update: async (args: unknown) => {
            calls.paymentUpdate = args;
            return args;
          },
        },
        order: {
          update: async (args: unknown) => {
            calls.orderUpdate = args;
            return args;
          },
        },
      } as never,
      {
        createCheckoutPreference: async () => {
          throw new Error('not used');
        },
      } as never,
      {
        logPaymentEvent: () => undefined,
        logWebhookEvent: (event: string, payload: unknown) => {
          webhookLogs.push({ event, payload });
        },
        logApplicationError: () => undefined,
      } as never,
      {
        consumeReservationForOrder: async () => undefined,
      } as never,
    ),
    now,
  );

  const result = await service.handleMercadoPagoWebhook({
    eventId: 'evt-stale-pending',
    resourceId: 'mp-123',
    status: 'pending',
    topic: 'payment',
  });

  assert.deepEqual(result, {
    status: 'ignored',
    orderId: 'order-1',
    paymentId: 'payment-1',
    paymentStatus: 'APPROVED',
  });
  assert.equal(calls.paymentUpdate, undefined);
  assert.equal(calls.orderUpdate, undefined);
  assert.deepEqual(calls.deliveryUpdate, {
    where: { id: 'delivery-1' },
    data: {
      paymentId: 'payment-1',
      processedAt: now,
      status: 'IGNORED',
    },
  });
  assert.deepEqual(webhookLogs.at(-1), {
    event: 'payment.webhook.ignored_transition',
    payload: {
      eventId: 'evt-stale-pending',
      orderId: 'order-1',
      paymentId: 'payment-1',
      currentStatus: 'APPROVED',
      attemptedStatus: 'PENDING',
    },
  });
});
