import { validateEnvironment } from './env.validation';

describe('validateEnvironment', () => {
  it('applies safe defaults for the platform baseline', () => {
    const config = validateEnvironment({});

    expect(config).toMatchObject({
      APP_NAME: 'vendora-backend',
      NODE_ENV: 'development',
      PORT: 3000,
    });
  });

  it('rejects partial Mercado Pago configuration', () => {
    expect(() =>
      validateEnvironment({
        MERCADOPAGO_ACCESS_TOKEN: 'token',
      }),
    ).toThrow(/Mercado Pago configuration requires both/);
  });

  it('rejects partial Cloudinary configuration', () => {
    expect(() =>
      validateEnvironment({
        CLOUDINARY_CLOUD_NAME: 'vendora',
        CLOUDINARY_API_KEY: 'key',
      }),
    ).toThrow(/Cloudinary configuration requires/);
  });
});
