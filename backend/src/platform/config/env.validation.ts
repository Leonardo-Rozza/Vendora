type EnvironmentVariables = {
  ADMIN_INITIAL_EMAIL?: string;
  ADMIN_INITIAL_PASSWORD?: string;
  ADMIN_SESSION_COOKIE_NAME?: string;
  ADMIN_SESSION_COOKIE_SAME_SITE?: 'lax' | 'none' | 'strict';
  ADMIN_SESSION_SECRET?: string;
  ADMIN_SESSION_TTL_HOURS?: number;
  APP_NAME?: string;
  CLOUDINARY_API_KEY?: string;
  CLOUDINARY_API_SECRET?: string;
  CLOUDINARY_CLOUD_NAME?: string;
  DATABASE_URL?: string;
  FRONTEND_APP_URL?: string;
  MERCADOPAGO_ACCESS_TOKEN?: string;
  MERCADOPAGO_WEBHOOK_SECRET?: string;
  NODE_ENV?: 'development' | 'test' | 'production';
  PORT?: number;
};

export function validateEnvironment(
  config: Record<string, unknown>,
): EnvironmentVariables {
  const value: EnvironmentVariables = {
    ADMIN_INITIAL_EMAIL: readOptionalEmail(config.ADMIN_INITIAL_EMAIL),
    ADMIN_INITIAL_PASSWORD: readOptionalString(config.ADMIN_INITIAL_PASSWORD),
    ADMIN_SESSION_COOKIE_NAME:
      readOptionalString(config.ADMIN_SESSION_COOKIE_NAME) ??
      'vendora_admin_session',
    ADMIN_SESSION_COOKIE_SAME_SITE: readCookieSameSite(
      config.ADMIN_SESSION_COOKIE_SAME_SITE,
      readNodeEnv(config.NODE_ENV) === 'production' ? 'none' : 'lax',
    ),
    ADMIN_SESSION_SECRET:
      readOptionalString(config.ADMIN_SESSION_SECRET) ??
      'vendora-admin-session-dev-secret',
    ADMIN_SESSION_TTL_HOURS: readPositiveInteger(
      config.ADMIN_SESSION_TTL_HOURS,
      12,
    ),
    APP_NAME: readOptionalString(config.APP_NAME) ?? 'vendora-backend',
    CLOUDINARY_API_KEY: readOptionalString(config.CLOUDINARY_API_KEY),
    CLOUDINARY_API_SECRET: readOptionalString(config.CLOUDINARY_API_SECRET),
    CLOUDINARY_CLOUD_NAME: readOptionalString(config.CLOUDINARY_CLOUD_NAME),
    DATABASE_URL: readOptionalUrl(config.DATABASE_URL, [
      'postgres:',
      'postgresql:',
    ]),
    FRONTEND_APP_URL: readOptionalUrlList(config.FRONTEND_APP_URL, [
      'http:',
      'https:',
    ]),
    MERCADOPAGO_ACCESS_TOKEN: readOptionalString(
      config.MERCADOPAGO_ACCESS_TOKEN,
    ),
    MERCADOPAGO_WEBHOOK_SECRET: readOptionalString(
      config.MERCADOPAGO_WEBHOOK_SECRET,
    ),
    NODE_ENV: readNodeEnv(config.NODE_ENV),
    PORT: readPort(config.PORT),
  };

  const hasMercadoPagoValue =
    Boolean(value.MERCADOPAGO_ACCESS_TOKEN) ||
    Boolean(value.MERCADOPAGO_WEBHOOK_SECRET);

  if (hasMercadoPagoValue) {
    if (!value.MERCADOPAGO_ACCESS_TOKEN || !value.MERCADOPAGO_WEBHOOK_SECRET) {
      throw new Error(
        'Environment validation failed: Mercado Pago configuration requires both MERCADOPAGO_ACCESS_TOKEN and MERCADOPAGO_WEBHOOK_SECRET',
      );
    }
  }

  const hasCloudinaryValue =
    Boolean(value.CLOUDINARY_CLOUD_NAME) ||
    Boolean(value.CLOUDINARY_API_KEY) ||
    Boolean(value.CLOUDINARY_API_SECRET);

  if (hasCloudinaryValue) {
    if (
      !value.CLOUDINARY_CLOUD_NAME ||
      !value.CLOUDINARY_API_KEY ||
      !value.CLOUDINARY_API_SECRET
    ) {
      throw new Error(
        'Environment validation failed: Cloudinary configuration requires CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET',
      );
    }
  }

  const hasAdminBootstrapValue =
    Boolean(value.ADMIN_INITIAL_EMAIL) || Boolean(value.ADMIN_INITIAL_PASSWORD);

  if (hasAdminBootstrapValue) {
    if (!value.ADMIN_INITIAL_EMAIL || !value.ADMIN_INITIAL_PASSWORD) {
      throw new Error(
        'Environment validation failed: Admin bootstrap requires both ADMIN_INITIAL_EMAIL and ADMIN_INITIAL_PASSWORD',
      );
    }
  }

  return value;
}

function readOptionalString(input: unknown): string | undefined {
  if (typeof input !== 'string') {
    return undefined;
  }

  const value = input.trim();
  return value.length > 0 ? value : undefined;
}

function readOptionalUrl(
  input: unknown,
  allowedProtocols: string[],
): string | undefined {
  const value = readOptionalString(input);

  if (!value) {
    return undefined;
  }

  try {
    const url = new URL(value);

    if (!allowedProtocols.includes(url.protocol)) {
      throw new Error('Invalid protocol');
    }

    return value;
  } catch {
    throw new Error(
      `Environment validation failed: Invalid URL value \"${value}\"`,
    );
  }
}

function readOptionalUrlList(
  input: unknown,
  allowedProtocols: string[],
): string | undefined {
  const value = readOptionalString(input);

  if (!value) {
    return undefined;
  }

  const urls = value
    .split(',')
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0)
    .map((entry) => readOptionalUrl(entry, allowedProtocols));

  if (urls.length === 0) {
    return undefined;
  }

  return urls.join(',');
}

function readOptionalEmail(input: unknown): string | undefined {
  const value = readOptionalString(input)?.toLowerCase();

  if (!value) {
    return undefined;
  }

  if (!value.includes('@')) {
    throw new Error(
      `Environment validation failed: Invalid email value "${value}"`,
    );
  }

  return value;
}

function readNodeEnv(input: unknown): 'development' | 'test' | 'production' {
  const value = readOptionalString(input) ?? 'development';

  if (value === 'development' || value === 'test' || value === 'production') {
    return value;
  }

  throw new Error(
    `Environment validation failed: Invalid NODE_ENV \"${value}\"`,
  );
}

function readPort(input: unknown): number {
  const value = readOptionalString(input) ?? '3000';
  const port = Number(value);

  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error(`Environment validation failed: Invalid PORT \"${value}\"`);
  }

  return port;
}

function readPositiveInteger(input: unknown, fallback: number): number {
  const value = readOptionalString(input);

  if (!value) {
    return fallback;
  }

  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed < 1) {
    throw new Error(
      `Environment validation failed: Invalid positive integer "${value}"`,
    );
  }

  return parsed;
}

function readCookieSameSite(
  input: unknown,
  fallback: 'lax' | 'none' | 'strict',
): 'lax' | 'none' | 'strict' {
  const value = readOptionalString(input)?.toLowerCase();

  if (!value) {
    return fallback;
  }

  if (value === 'lax' || value === 'none' || value === 'strict') {
    return value;
  }

  throw new Error(
    `Environment validation failed: Invalid ADMIN_SESSION_COOKIE_SAME_SITE "${value}"`,
  );
}
