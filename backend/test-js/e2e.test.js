const assert = require('node:assert/strict');
const { afterEach, beforeEach, describe, test } = require('node:test');
const request = require('supertest');
const { Test } = require('@nestjs/testing');

const { AppModule } = require('../dist/app.module.js');
const { configureApp } = require('../dist/platform/configure-app.js');

let app;

describe('Platform foundation (e2e)', () => {
  beforeEach(async () => {
    const moduleFixture = await Test.createTestingModule({
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
        assert.deepEqual(body, {
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
      .send({ orderId: null, payerEmail: 'invalid-email' })
      .expect(400)
      .expect(({ body }) => {
        assert.equal(body.error, 'Bad Request');
        assert.equal(body.statusCode, 400);
        assert.match(body.message.join(' '), /orderId must be a string/i);
        assert.match(body.message.join(' '), /payerEmail must be an email/i);
      });
  });

  test('/api/payments/webhooks/mercado-pago (POST) validates webhook payloads', async () => {
    await request(app.getHttpServer())
      .post('/api/payments/webhooks/mercado-pago')
      .send({ eventId: null, resourceId: null, status: 'unknown' })
      .expect(400)
      .expect(({ body }) => {
        assert.equal(body.error, 'Bad Request');
        assert.equal(body.statusCode, 400);
        assert.match(body.message.join(' '), /eventId must be a string/i);
        assert.match(body.message.join(' '), /resourceId must be a string/i);
        assert.match(
          body.message.join(' '),
          /status must be one of the following values/i,
        );
      });
  });

  test('/api/orders (POST) validates cart payloads', async () => {
    await request(app.getHttpServer())
      .post('/api/orders')
      .send({ items: [{ variantId: null, quantity: 0 }] })
      .expect(400)
      .expect(({ body }) => {
        assert.equal(body.error, 'Bad Request');
        assert.equal(body.statusCode, 400);
        assert.match(body.message.join(' '), /variantId must be a string/i);
        assert.match(body.message.join(' '), /quantity must not be less than 1/i);
      });
  });

  test('/api/admin/catalog/products (POST) validates admin catalog payloads', async () => {
    await request(app.getHttpServer())
      .post('/api/admin/catalog/products')
      .send({ slug: null, name: null, variants: [] })
      .expect(400)
      .expect(({ body }) => {
        assert.equal(body.error, 'Bad Request');
        assert.equal(body.statusCode, 400);
        assert.match(body.message.join(' '), /slug must be a string/i);
        assert.match(body.message.join(' '), /variants must contain at least 1 elements/i);
      });
  });

  test('/api/admin/inventory/variants/:variantId (PATCH) validates inventory adjustments', async () => {
    await request(app.getHttpServer())
      .patch('/api/admin/inventory/variants/variant-1')
      .send({ availableQuantity: -1 })
      .expect(400)
      .expect(({ body }) => {
        assert.equal(body.error, 'Bad Request');
        assert.equal(body.statusCode, 400);
        assert.match(body.message.join(' '), /availableQuantity must not be less than 0/i);
      });
  });

  test('/api/media/product-images/upload-signatures (POST) validates write payloads', async () => {
    await request(app.getHttpServer())
      .post('/api/media/product-images/upload-signatures')
      .send({ productId: null })
      .expect(400)
      .expect(({ body }) => {
        assert.equal(body.error, 'Bad Request');
        assert.equal(body.statusCode, 400);
        assert.match(body.message.join(' '), /productId must be a string/i);
      });
  });
});
