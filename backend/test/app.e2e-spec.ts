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

  it('/api/health (GET)', () => {
    return request(app.getHttpServer())
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
            cloudinary: {
              configured: false,
              reason: 'Missing Cloudinary credentials',
            },
          },
        });
      });
  });
});
