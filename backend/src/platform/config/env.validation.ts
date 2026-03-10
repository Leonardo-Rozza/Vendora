import Joi from 'joi';

type EnvironmentVariables = {
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

const environmentSchema = Joi.object<EnvironmentVariables>({
  APP_NAME: Joi.string().trim().default('vendora-backend'),
  CLOUDINARY_API_KEY: Joi.string().trim().optional(),
  CLOUDINARY_API_SECRET: Joi.string().trim().optional(),
  CLOUDINARY_CLOUD_NAME: Joi.string().trim().optional(),
  DATABASE_URL: Joi.string()
    .uri({ scheme: ['postgres', 'postgresql'] })
    .optional(),
  FRONTEND_APP_URL: Joi.string()
    .uri({ scheme: ['http', 'https'] })
    .optional(),
  MERCADOPAGO_ACCESS_TOKEN: Joi.string().trim().optional(),
  MERCADOPAGO_WEBHOOK_SECRET: Joi.string().trim().optional(),
  NODE_ENV: Joi.string()
    .valid('development', 'test', 'production')
    .default('development'),
  PORT: Joi.number().port().default(3000),
}).prefs({ abortEarly: false, allowUnknown: true });

export function validateEnvironment(
  config: Record<string, unknown>,
): EnvironmentVariables {
  const validationResult = environmentSchema.validate(config) as {
    error?: Error;
    value: EnvironmentVariables;
  };
  const { error, value } = validationResult;

  if (error) {
    throw new Error(`Environment validation failed: ${error.message}`);
  }

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

  return value;
}
