const assert = require('node:assert/strict');
const { afterEach, beforeEach, describe, test } = require('node:test');
const path = require('node:path');
const request = require('supertest');
const { Test } = require('@nestjs/testing');
const { AppModule } = require(path.join(__dirname, '..', 'dist', 'app.module.js'));
const { configureApp } = require(
  path.join(__dirname, '..', 'dist', 'platform', 'configure-app.js'),
);
const { AdminSessionGuard } = require(
  path.join(
    __dirname,
    '..',
    'dist',
    'domains',
    'auth',
    'guards',
    'admin-session.guard.js',
  ),
);
const { OrdersService } = require(
  path.join(__dirname, '..', 'dist', 'domains', 'orders', 'orders.service.js'),
);

describe('Admin fulfillment endpoint (authorized e2e)', () => {
  let app;
  let receivedCall;

  beforeEach(async () => {
    receivedCall = undefined;

    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideGuard(AdminSessionGuard)
      .useValue({ canActivate: () => true })
      .overrideProvider(OrdersService)
      .useValue({
        createOrder: async () => undefined,
        listOrders: async () => [],
        findOrderById: async () => null,
        cancelOrder: async () => undefined,
        updateOrderFulfillment: async (orderId, payload) => {
          receivedCall = { orderId, payload };

          return {
            id: orderId,
            status: 'PAID',
            fulfillmentStatus: payload.fulfillmentStatus,
            fulfillmentNotes: payload.fulfillmentNotes ?? null,
            deliveryReference: payload.deliveryReference ?? null,
          };
        },
      })
      .compile();

    app = moduleFixture.createNestApplication();
    configureApp(app);
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  test('PATCH /api/admin/orders/:orderId/fulfillment accepts an authorized next-step transition', async () => {
    await request(app.getHttpServer())
      .patch('/api/admin/orders/order-1/fulfillment')
      .send({
        fulfillmentStatus: 'CONFIRMED',
        fulfillmentNotes: 'Picked for dispatch',
        deliveryReference: 'AMBA-14',
      })
      .expect(200)
      .expect(({ body }) => {
        assert.deepEqual(body, {
          id: 'order-1',
          status: 'PAID',
          fulfillmentStatus: 'CONFIRMED',
          fulfillmentNotes: 'Picked for dispatch',
          deliveryReference: 'AMBA-14',
        });
      });

    assert.deepEqual(
      {
        orderId: receivedCall?.orderId,
        payload: receivedCall
          ? {
              fulfillmentStatus: receivedCall.payload.fulfillmentStatus,
              fulfillmentNotes: receivedCall.payload.fulfillmentNotes,
              deliveryReference: receivedCall.payload.deliveryReference,
            }
          : null,
      },
      {
      orderId: 'order-1',
      payload: {
        fulfillmentStatus: 'CONFIRMED',
        fulfillmentNotes: 'Picked for dispatch',
        deliveryReference: 'AMBA-14',
      },
      },
    );
  });
});
