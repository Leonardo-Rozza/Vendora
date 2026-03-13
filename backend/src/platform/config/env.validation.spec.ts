import assert from 'node:assert/strict';
import test from 'node:test';
import { validateEnvironment } from './env.validation';

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

test('validateEnvironment rejects partial admin bootstrap configuration', () => {
  assert.throws(
    () =>
      validateEnvironment({
        ADMIN_INITIAL_EMAIL: 'ops@vendora.local',
      }),
    /Admin bootstrap requires both/,
  );
});

test('validateEnvironment accepts comma-separated frontend origins and production cookie defaults', () => {
  const config = validateEnvironment({
    NODE_ENV: 'production',
    FRONTEND_APP_URL:
      'https://vendora.example.com/, https://admin.vendora.example.com',
  });

  assert.equal(
    config.FRONTEND_APP_URL,
    'https://vendora.example.com/,https://admin.vendora.example.com',
  );
  assert.equal(config.ADMIN_SESSION_COOKIE_SAME_SITE, 'none');
});
