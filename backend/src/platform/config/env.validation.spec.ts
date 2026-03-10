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
