import { validateEnvironment } from './env.validation';

test('validateEnvironment applies safe defaults for the platform baseline', () => {
  const config = validateEnvironment({});

  expect(config.APP_NAME).toBe('vendora-backend');
  expect(config.NODE_ENV).toBe('development');
  expect(config.PORT).toBe(3000);
  expect(config.ORDER_PENDING_TTL_MINUTES).toBe(60);
});

test('validateEnvironment parses a custom order pending TTL', () => {
  const config = validateEnvironment({ ORDER_PENDING_TTL_MINUTES: '90' });

  expect(config.ORDER_PENDING_TTL_MINUTES).toBe(90);
});

test('validateEnvironment rejects a non-positive order pending TTL', () => {
  expect(() => validateEnvironment({ ORDER_PENDING_TTL_MINUTES: '0' })).toThrow(
    /Invalid positive integer/,
  );
});

test('validateEnvironment rejects partial Mercado Pago configuration', () => {
  expect(() =>
    validateEnvironment({
      MERCADOPAGO_ACCESS_TOKEN: 'token',
    }),
  ).toThrow(/Mercado Pago configuration requires both/);
});

test('validateEnvironment rejects partial Cloudinary configuration', () => {
  expect(() =>
    validateEnvironment({
      CLOUDINARY_CLOUD_NAME: 'vendora',
      CLOUDINARY_API_KEY: 'key',
    }),
  ).toThrow(/Cloudinary configuration requires/);
});

test('validateEnvironment rejects partial admin bootstrap configuration', () => {
  expect(() =>
    validateEnvironment({
      ADMIN_INITIAL_EMAIL: 'ops@vendora.local',
    }),
  ).toThrow(/Admin bootstrap requires both/);
});

test('validateEnvironment accepts comma-separated frontend origins and production cookie defaults', () => {
  const config = validateEnvironment({
    NODE_ENV: 'production',
    DATABASE_URL: 'postgresql://user:pass@db.example.com:5432/vendora',
    ADMIN_SESSION_SECRET: 'a-strong-production-secret-value-32+chars',
    FRONTEND_APP_URL:
      'https://vendora.example.com/, https://admin.vendora.example.com',
  });

  expect(config.FRONTEND_APP_URL).toBe(
    'https://vendora.example.com/,https://admin.vendora.example.com',
  );
  expect(config.ADMIN_SESSION_COOKIE_SAME_SITE).toBe('none');
});

test('validateEnvironment requires critical secrets and frontend origin in production', () => {
  expect(() => validateEnvironment({ NODE_ENV: 'production' })).toThrow(
    /DATABASE_URL is required in production/,
  );

  expect(() =>
    validateEnvironment({
      NODE_ENV: 'production',
      DATABASE_URL: 'postgresql://user:pass@db.example.com:5432/vendora',
      FRONTEND_APP_URL: 'https://vendora.example.com',
    }),
  ).toThrow(/ADMIN_SESSION_SECRET must be set to a strong non-default value/);

  expect(() =>
    validateEnvironment({
      NODE_ENV: 'production',
      DATABASE_URL: 'postgresql://user:pass@db.example.com:5432/vendora',
      ADMIN_SESSION_SECRET: 'too-short',
      FRONTEND_APP_URL: 'https://vendora.example.com',
    }),
  ).toThrow(/ADMIN_SESSION_SECRET must be at least 32 characters/);

  expect(() =>
    validateEnvironment({
      NODE_ENV: 'production',
      DATABASE_URL: 'postgresql://user:pass@db.example.com:5432/vendora',
      ADMIN_SESSION_SECRET: 'a-strong-production-secret-value-32+chars',
    }),
  ).toThrow(/FRONTEND_APP_URL is required in production/);
});

test('validateEnvironment rejects partial notification email configuration', () => {
  expect(() =>
    validateEnvironment({
      NOTIFICATION_EMAIL_FROM: 'ops@vendora.local',
    }),
  ).toThrow(/Notification email configuration requires both/);
});

test('validateEnvironment accepts notification email configuration', () => {
  const config = validateEnvironment({
    NOTIFICATION_EMAIL_API_KEY: 'notif-key',
    NOTIFICATION_EMAIL_FROM: 'ops@vendora.local',
    NOTIFICATION_EMAIL_FROM_NAME: 'Vendora',
    NOTIFICATION_EMAIL_REPLY_TO: 'ayuda@vendora.local',
  });

  expect(config.NOTIFICATION_EMAIL_API_KEY).toBe('notif-key');
  expect(config.NOTIFICATION_EMAIL_FROM).toBe('ops@vendora.local');
  expect(config.NOTIFICATION_EMAIL_FROM_NAME).toBe('Vendora');
  expect(config.NOTIFICATION_EMAIL_REPLY_TO).toBe('ayuda@vendora.local');
  expect(config.NOTIFICATION_EMAIL_API_BASE_URL).toBe('https://api.resend.com');
});
