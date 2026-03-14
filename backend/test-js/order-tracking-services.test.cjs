const assert = require('node:assert/strict');
const test = require('node:test');

require('ts-node/register/transpile-only');

const { Prisma } = require('@prisma/client');
const { OrdersService } = require('../src/domains/orders/orders.service.ts');
const {
  PaymentsService,
} = require('../src/domains/payments/payments.service.ts');
const {
  NotificationsService,
} = require('../src/domains/notifications/notifications.service.ts');

const validCheckoutInput = {
  contact: {
    fullName: 'Ada Buyer',
    email: 'ada@example.com',
    phone: '11 5555 1111',
  },
  shippingAddress: {
    recipientName: 'Ada Buyer',
    phone: '11 5555 1111',
    streetLine1: 'Cabildo 123',
    locality: 'CABA',
    province: 'CABA',
    postalCode: 'C1426',
  },
};

test('OrdersService createOrder persists initial milestones and tracking metadata', async () => {
  const calls = {
    reserveItems: null,
    orderCreate: null,
    milestones: [],
  };

  const service = new OrdersService(
    {
      productVariant: {
        findMany: async () => [
          {
            id: 'variant-1',
            sku: 'SKU-1',
            name: 'Standard',
            priceAmount: new Prisma.Decimal('12500.00'),
            currencyCode: 'ARS',
            product: {
              name: 'Mate',
              status: 'ACTIVE',
            },
            inventoryItem: {
              availableQuantity: 5,
            },
          },
        ],
      },
      $transaction: async (callback) =>
        callback({
          order: {
            create: async (args) => {
              calls.orderCreate = args;
              return {
                id: 'order-1',
                status: 'PENDING_PAYMENT',
                trackingToken: args.data.trackingToken,
                trackingCode: args.data.trackingCode,
                items: [],
                payments: [],
                user: null,
              };
            },
          },
          orderMilestone: {
            create: async (args) => {
              calls.milestones.push(args.data.type);
              return {
                id: `milestone-${calls.milestones.length}`,
                type: args.data.type,
              };
            },
          },
        }),
    },
    {
      reserveItems: async (_client, items) => {
        calls.reserveItems = items;
      },
      releaseReservationForOrder: async () => undefined,
    },
  );

  const result = await service.createOrder({
    items: [{ variantId: 'variant-1', quantity: 1 }],
    ...validCheckoutInput,
  });

  assert.deepEqual(calls.reserveItems, [
    { variantId: 'variant-1', quantity: 1 },
  ]);
  assert.equal(typeof result.trackingToken, 'string');
  assert.match(result.trackingToken, /^[A-Za-z0-9_-]+$/);
  assert.match(result.trackingCode, /^VEN-/);
  assert.equal(result.trackingUrlPath, `/seguimiento/${result.trackingToken}`);
  assert.equal(calls.orderCreate.data.status, 'PENDING_PAYMENT');
  assert.deepEqual(calls.milestones, ['ORDER_CREATED', 'PAYMENT_PENDING']);
});

test('OrdersService updateOrderFulfillment creates milestone metadata and dispatches notifications', async () => {
  const calls = {
    orderUpdate: null,
    milestoneCreate: null,
    notification: null,
  };

  const service = new OrdersService(
    {
      order: {
        findUnique: async () => ({
          id: 'order-1',
          status: 'PAID',
          fulfillmentStatus: 'READY_FOR_DELIVERY',
          contactEmail: 'ada@example.com',
          contactFullName: 'Ada Buyer',
          trackingToken: 'tracking-1',
          trackingCode: 'VEN-TEST-0001',
          deliveryReference: 'OPS-9',
          items: [],
          payments: [],
          user: null,
        }),
      },
      $transaction: async (callback) =>
        callback({
          order: {
            update: async (args) => {
              calls.orderUpdate = args;
              return {
                id: 'order-1',
                status: 'PAID',
                fulfillmentStatus: 'OUT_FOR_DELIVERY',
                contactEmail: 'ada@example.com',
                contactFullName: 'Ada Buyer',
                trackingToken: 'tracking-1',
                trackingCode: 'VEN-TEST-0001',
                deliveryReference: 'OPS-9',
                items: [],
                payments: [],
                user: null,
              };
            },
          },
          orderMilestone: {
            create: async (args) => {
              calls.milestoneCreate = args;
              return {
                id: 'milestone-3',
                type: args.data.type,
              };
            },
          },
        }),
    },
    {
      reserveItems: async () => undefined,
      releaseReservationForOrder: async () => undefined,
    },
    {
      dispatchMilestoneNotification: async (payload) => {
        calls.notification = payload;
        return {
          status: 'sent',
          channel: 'email',
          provider: 'resend-compatible',
        };
      },
    },
  );

  const result = await service.updateOrderFulfillment('order-1', {
    fulfillmentStatus: 'OUT_FOR_DELIVERY',
    deliveryReference: 'OPS-9',
  });

  assert.equal(result.fulfillmentStatus, 'OUT_FOR_DELIVERY');
  assert.equal(result.buyerTrackingStatus, 'EN_CAMINO');
  assert.equal(calls.milestoneCreate.data.type, 'OUT_FOR_DELIVERY');
  assert.deepEqual(calls.milestoneCreate.data.metadata, {
    deliveryReference: 'OPS-9',
  });
  assert.equal(calls.notification.milestoneType, 'OUT_FOR_DELIVERY');
  assert.equal(calls.notification.trackingToken, 'tracking-1');
});

test('PaymentsService approved webhook records milestone and dispatches notification', async () => {
  const calls = {
    milestoneCreate: null,
    notification: null,
  };

  const transactionClient = {
    payment: {
      update: async () => ({ id: 'payment-1', status: 'APPROVED' }),
    },
    order: {
      update: async () => ({
        id: 'order-1',
        deliveryReference: 'OPS-10',
      }),
    },
    orderMilestone: {
      create: async (args) => {
        calls.milestoneCreate = args;
        return {
          id: 'milestone-payment',
          type: args.data.type,
        };
      },
    },
    paymentWebhookDelivery: {
      update: async () => undefined,
    },
  };

  const service = new PaymentsService(
    {
      $transaction: async (callback) => callback(transactionClient),
      paymentWebhookDelivery: {
        create: async () => ({ id: 'delivery-1' }),
      },
      payment: {
        findFirst: async () => ({
          id: 'payment-1',
          orderId: 'order-1',
          status: 'PENDING',
          order: {
            id: 'order-1',
            status: 'PENDING_PAYMENT',
            isLocked: false,
            trackingToken: 'tracking-1',
            trackingCode: 'VEN-TEST-0001',
            contactEmail: 'ada@example.com',
            contactFullName: 'Ada Buyer',
          },
        }),
      },
    },
    {
      createCheckoutPreference: async () => {
        throw new Error('not used');
      },
    },
    {
      logPaymentEvent: () => undefined,
      logWebhookEvent: () => undefined,
      logApplicationError: () => undefined,
    },
    {
      consumeReservationForOrder: async () => undefined,
    },
    {
      dispatchMilestoneNotification: async (payload) => {
        calls.notification = payload;
        return {
          status: 'sent',
          channel: 'email',
          provider: 'resend-compatible',
        };
      },
    },
  );

  const result = await service.handleMercadoPagoWebhook({
    eventId: 'evt-1',
    resourceId: 'mp-123',
    status: 'approved',
    topic: 'payment',
  });

  assert.equal(result.status, 'processed');
  assert.equal(calls.milestoneCreate.data.type, 'PAYMENT_CONFIRMED');
  assert.equal(calls.notification.milestoneType, 'PAYMENT_CONFIRMED');
  assert.equal(calls.notification.trackingCode, 'VEN-TEST-0001');
});

test('NotificationsService dedupes milestone sends and persists failed delivery state', async () => {
  const calls = {
    created: 0,
    updated: null,
    sent: 0,
  };

  const service = new NotificationsService(
    {
      notificationDelivery: {
        findFirst: async ({ where }) =>
          where.milestoneId === 'milestone-existing'
            ? { id: 'delivery-1' }
            : null,
        create: async () => {
          calls.created += 1;
          return { id: 'delivery-new' };
        },
        update: async (args) => {
          calls.updated = args;
          return args;
        },
      },
    },
    {
      frontendAppUrl: 'https://vendora.example.com',
    },
    {
      send: async () => {
        calls.sent += 1;
        throw new Error('provider down');
      },
    },
    {
      logApplicationEvent: () => undefined,
      logApplicationError: () => undefined,
    },
  );

  const skipped = await service.dispatchMilestoneNotification({
    orderId: 'order-1',
    milestoneId: 'milestone-existing',
    milestoneType: 'PAYMENT_CONFIRMED',
    trackingToken: 'tracking-1',
    trackingCode: 'VEN-TEST-0001',
    recipientEmail: 'ada@example.com',
    recipientName: 'Ada Buyer',
  });

  const failed = await service.dispatchMilestoneNotification({
    orderId: 'order-1',
    milestoneId: 'milestone-new',
    milestoneType: 'PAYMENT_CONFIRMED',
    trackingToken: 'tracking-1',
    trackingCode: 'VEN-TEST-0001',
    recipientEmail: 'ada@example.com',
    recipientName: 'Ada Buyer',
  });

  assert.equal(skipped.status, 'skipped');
  assert.equal(failed.status, 'failed');
  assert.equal(calls.created, 1);
  assert.equal(calls.sent, 1);
  assert.equal(calls.updated.data.status, 'FAILED');
  assert.match(calls.updated.data.errorMessage, /provider down/);
});
