import assert from 'node:assert/strict';
import { afterEach, beforeEach, describe, test } from 'node:test';
import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/platform/configure-app';

describe('Platform foundation (e2e)', () => {
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
      .send({ orderId: 42, payerEmail: 'invalid-email' })
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
      .send({ eventId: 123, resourceId: null, status: 'unknown' })
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

  test('/api/media/product-images/upload-signatures (POST) validates write payloads', async () => {
    await request(app.getHttpServer())
      .post('/api/media/product-images/upload-signatures')
      .send({ productId: 42 })
      .expect(400)
      .expect(({ body }) => {
        assert.equal(body.error, 'Bad Request');
        assert.equal(body.statusCode, 400);
        assert.match(body.message.join(' '), /productId must be a string/i);
      });
  });

  test('/api/admin/catalog/products (GET) rejects unauthenticated access', async () => {
    await request(app.getHttpServer())
      .get('/api/admin/catalog/products')
      .expect(401)
      .expect(({ body }) => {
        assert.equal(body.statusCode, 401);
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
        assert.equal(body.error, 'Bad Request');
        assert.match(
          body.message.join(' '),
          /contact should not be null or undefined/i,
        );
        assert.match(
          body.message.join(' '),
          /shippingAddress should not be null or undefined/i,
        );
      });
  });
});
