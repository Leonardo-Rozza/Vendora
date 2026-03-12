const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const { Prisma } = require('@prisma/client');

const {
  validateEnvironment,
} = require('../dist/platform/config/env.validation.js');
const {
  PaymentsService,
} = require('../dist/domains/payments/payments.service.js');

const noopInventoryService = {
  consumeReservationForOrder: async () => undefined,
};

const readProjectFile = (relativePath) =>
  fs.readFileSync(path.join(process.cwd(), relativePath), 'utf8');

test('validateEnvironment applies safe defaults for the platform baseline', () => {
  const config = validateEnvironment({});

  assert.equal(config.APP_NAME, 'vendora-backend');
  assert.equal(config.NODE_ENV, 'development');
  assert.equal(config.PORT, 3000);
});

test('validateEnvironment rejects partial Mercado Pago configuration', () => {
  assert.throws(
    () =>
      validateEnvironment({
        MERCADOPAGO_ACCESS_TOKEN: 'token',
      }),
    /Mercado Pago configuration requires both/,
  );
});

test('validateEnvironment rejects partial Cloudinary configuration', () => {
  assert.throws(
    () =>
      validateEnvironment({
        CLOUDINARY_CLOUD_NAME: 'vendora',
        CLOUDINARY_API_KEY: 'key',
      }),
    /Cloudinary configuration requires/,
  );
});

test('Foundation scope guard keeps excluded domains out of backend modules', () => {
  assert.equal(fs.existsSync(path.join(process.cwd(), 'src/domains/shipping')), false);
  assert.equal(fs.existsSync(path.join(process.cwd(), 'src/domains/discounts')), false);
  assert.equal(fs.existsSync(path.join(process.cwd(), 'src/domains/reviews')), false);
  assert.equal(fs.existsSync(path.join(process.cwd(), 'src/domains/analytics')), false);
});

test('Catalog foundation keeps products, variants, inventory, and images structurally aligned', () => {
  const schema = readProjectFile('prisma/schema.prisma');

  assert.match(schema, /model Product \{/);
  assert.match(schema, /model ProductVariant \{/);
  assert.match(schema, /model InventoryItem \{/);
  assert.match(schema, /variantId\s+String\s+@unique/);
  assert.match(schema, /reservedQuantity\s+Int\s+@default\(0\)/);
  assert.match(schema, /model ProductImage \{/);
  assert.match(schema, /sortOrder\s+Int\s+@default\(0\)/);
  assert.match(schema, /@@index\(\[productId, sortOrder\]\)/);
});

test('Orders and payments foundation keeps user, order, payment, and webhook boundaries explicit', () => {
  const schema = readProjectFile('prisma/schema.prisma');

  assert.match(schema, /model User \{/);
  assert.match(schema, /orders\s+Order\[]/);
  assert.match(schema, /model Order \{/);
  assert.match(schema, /payments\s+Payment\[]/);
  assert.match(schema, /model Payment \{/);
  assert.match(schema, /model PaymentWebhookDelivery \{/);
  assert.match(schema, /@@unique\(\[provider, providerEventId\]\)/);
});

test('PaymentsService creates a Mercado Pago checkout preference for an unpaid order', async () => {
  const calls = { orderFind: undefined, paymentCreate: undefined };
  const paymentLogs = [];
  const service = new PaymentsService(
    {
      order: {
        findUnique: async (args) => {
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
        create: async (args) => {
          calls.paymentCreate = args;
          return { id: 'payment-1' };
        },
      },
      paymentWebhookDelivery: {},
    },
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
    },
    {
      logPaymentEvent: (event, payload) => paymentLogs.push({ event, payload }),
      logWebhookEvent: () => undefined,
      logApplicationError: () => undefined,
    },
    noopInventoryService,
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
    include: { items: true, payments: true },
  });
  assert.equal(calls.paymentCreate.data.status, 'PENDING');
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

test('PaymentsService keeps paid orders immutable after approval and ignores stale webhook regressions', async () => {
  const calls = {};
  const now = new Date('2024-01-03T00:00:00.000Z');
  const service = new PaymentsService(
    {
      $transaction: async (callback) =>
        callback({
          payment: {
            update: async (args) => {
              calls.paymentUpdate = args;
              return args;
            },
          },
          order: {
            update: async (args) => {
              calls.orderUpdate = args;
              return args;
            },
          },
          paymentWebhookDelivery: {
            update: async (args) => {
              calls.deliveryUpdate = args;
              return args;
            },
          },
        }),
      paymentWebhookDelivery: {
        create: async () => ({ id: 'delivery-1' }),
        update: async (args) => {
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
    noopInventoryService,
  );

  Object.defineProperty(service, 'getNow', {
    value: () => now,
  });

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
});

test('PaymentsService deduplicates repeated webhook deliveries by provider event id', async () => {
  const service = new PaymentsService(
    {
      paymentWebhookDelivery: {
        create: async () => {
          throw new Prisma.PrismaClientKnownRequestError('duplicate webhook', {
            code: 'P2002',
            clientVersion: 'test',
          });
        },
      },
      payment: {
        findFirst: async () => ({ id: 'payment-1' }),
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
    noopInventoryService,
  );

  const result = await service.handleMercadoPagoWebhook({
    eventId: 'evt-1',
    resourceId: 'mp-123',
    status: 'approved',
    topic: 'payment',
  });

  assert.deepEqual(result, { status: 'duplicate' });
});
