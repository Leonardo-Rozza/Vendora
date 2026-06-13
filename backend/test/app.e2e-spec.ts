import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import type { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { AdminSessionGuard } from '../src/domains/auth/guards/admin-session.guard';
import { OrdersService } from '../src/domains/orders/orders.service';
import { configureApp } from '../src/platform/configure-app';

describe('Platform foundation (e2e)', () => {
  jest.setTimeout(30000);

  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    configureApp(app);
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  test('/api/health (GET)', async () => {
    await request(app.getHttpServer())
      .get('/api/health')
      .expect(200)
      .expect(({ body }) => {
        expect(body).toEqual({
          status: 'ok',
          app: {
            name: 'vendora-backend',
            environment: 'test',
          },
          services: {
            database: {
              configured: false,
              reason: 'Missing DATABASE_URL',
            },
            mercadoPago: {
              configured: false,
              reason:
                'Missing MERCADOPAGO_ACCESS_TOKEN and MERCADOPAGO_WEBHOOK_SECRET',
            },
            notificationEmail: {
              configured: false,
              reason: 'Missing notification email credentials',
            },
            cloudinary: {
              configured: false,
              reason: 'Missing Cloudinary credentials',
            },
          },
        });
      });
  });

  test('/api/payments/checkout-preferences (POST) validates write payloads', async () => {
    await request(app.getHttpServer())
      .post('/api/payments/checkout-preferences')
      .send({ payerEmail: 'invalid-email' })
      .expect(400)
      .expect(({ body }) => {
        expect(body.error).toBe('Bad Request');
        expect(body.statusCode).toBe(400);
        expect(body.message.join(' ')).toMatch(/orderId must be a string/i);
        expect(body.message.join(' ')).toMatch(/payerEmail must be an email/i);
      });
  });

  test('/api/payments/webhooks/mercado-pago (POST) validates webhook payloads', async () => {
    // The webhook DTO no longer accepts a `status` field (the status is fetched
    // from Mercado Pago, never trusted from the body), so it is now rejected as
    // a non-whitelisted property.
    await request(app.getHttpServer())
      .post('/api/payments/webhooks/mercado-pago')
      .send({ resourceId: null, status: 'unknown' })
      .expect(400)
      .expect(({ body }) => {
        expect(body.error).toBe('Bad Request');
        expect(body.statusCode).toBe(400);
        expect(body.message.join(' ')).toMatch(/eventId must be a string/i);
        expect(body.message.join(' ')).toMatch(/resourceId must be a string/i);
        expect(body.message.join(' ')).toMatch(
          /property status should not exist/i,
        );
      });
  });

  test('/api/media/product-images/upload-signatures (POST) rejects unauthenticated access', async () => {
    // Image upload signing is admin-only: the session guard runs before payload
    // validation, so unauthenticated callers get 401 regardless of body.
    await request(app.getHttpServer())
      .post('/api/media/product-images/upload-signatures')
      .send({ productId: 42 })
      .expect(401)
      .expect(({ body }) => {
        expect(body.statusCode).toBe(401);
      });
  });

  test('/api/admin/catalog/products (GET) rejects unauthenticated access', async () => {
    await request(app.getHttpServer())
      .get('/api/admin/catalog/products')
      .expect(401)
      .expect(({ body }) => {
        expect(body.statusCode).toBe(401);
      });
  });

  test('/api/admin/orders/:orderId/fulfillment (PATCH) rejects unauthenticated access', async () => {
    await request(app.getHttpServer())
      .patch('/api/admin/orders/order-1/fulfillment')
      .send({ fulfillmentStatus: 'CONFIRMED' })
      .expect(401)
      .expect(({ body }) => {
        expect(body.statusCode).toBe(401);
      });
  });

  test('/api/orders (POST) validates required contact and shipping fields', async () => {
    await request(app.getHttpServer())
      .post('/api/orders')
      .send({
        items: [{ variantId: 'variant-1', quantity: 1 }],
      })
      .expect(400)
      .expect(({ body }) => {
        expect(body.error).toBe('Bad Request');
        expect(body.message.join(' ')).toMatch(
          /contact should not be null or undefined/i,
        );
        expect(body.message.join(' ')).toMatch(
          /shippingAddress should not be null or undefined/i,
        );
      });
  });
});

describe('Admin fulfillment endpoint (authorized)', () => {
  jest.setTimeout(30000);

  let app: INestApplication<App>;
  let receivedCall:
    | {
        orderId: string;
        payload: {
          fulfillmentStatus: string;
          fulfillmentNotes?: string;
          deliveryReference?: string;
        };
      }
    | undefined;

  beforeEach(async () => {
    receivedCall = undefined;

    const moduleFixture: TestingModule = await Test.createTestingModule({
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
        updateOrderFulfillment: async (
          orderId: string,
          payload: {
            fulfillmentStatus: string;
            fulfillmentNotes?: string;
            deliveryReference?: string;
          },
        ) => {
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

  test('/api/admin/orders/:orderId/fulfillment (PATCH) accepts an authorized next-step transition', async () => {
    await request(app.getHttpServer())
      .patch('/api/admin/orders/order-1/fulfillment')
      .send({
        fulfillmentStatus: 'CONFIRMED',
        fulfillmentNotes: 'Picked for dispatch',
        deliveryReference: 'AMBA-14',
      })
      .expect(200)
      .expect(({ body }) => {
        expect(body).toEqual({
          id: 'order-1',
          status: 'PAID',
          fulfillmentStatus: 'CONFIRMED',
          fulfillmentNotes: 'Picked for dispatch',
          deliveryReference: 'AMBA-14',
        });
      });

    expect(receivedCall).toEqual({
      orderId: 'order-1',
      payload: {
        fulfillmentStatus: 'CONFIRMED',
        fulfillmentNotes: 'Picked for dispatch',
        deliveryReference: 'AMBA-14',
      },
    });
  });
});
