"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateEnvironment = validateEnvironment;
const joi_1 = __importDefault(require("joi"));
const environmentSchema = joi_1.default.object({
    APP_NAME: joi_1.default.string().trim().default('vendora-backend'),
    CLOUDINARY_API_KEY: joi_1.default.string().trim().optional(),
    CLOUDINARY_API_SECRET: joi_1.default.string().trim().optional(),
    CLOUDINARY_CLOUD_NAME: joi_1.default.string().trim().optional(),
    DATABASE_URL: joi_1.default.string()
        .uri({ scheme: ['postgres', 'postgresql'] })
        .optional(),
    FRONTEND_APP_URL: joi_1.default.string()
        .uri({ scheme: ['http', 'https'] })
        .optional(),
    MERCADOPAGO_ACCESS_TOKEN: joi_1.default.string().trim().optional(),
    MERCADOPAGO_WEBHOOK_SECRET: joi_1.default.string().trim().optional(),
    NODE_ENV: joi_1.default.string()
        .valid('development', 'test', 'production')
        .default('development'),
    PORT: joi_1.default.number().port().default(3000),
}).prefs({ abortEarly: false, allowUnknown: true });
function validateEnvironment(config) {
    const validationResult = environmentSchema.validate(config);
    const { error, value } = validationResult;
    if (error) {
        throw new Error(`Environment validation failed: ${error.message}`);
    }
    const hasMercadoPagoValue = Boolean(value.MERCADOPAGO_ACCESS_TOKEN) ||
        Boolean(value.MERCADOPAGO_WEBHOOK_SECRET);
    if (hasMercadoPagoValue) {
        if (!value.MERCADOPAGO_ACCESS_TOKEN || !value.MERCADOPAGO_WEBHOOK_SECRET) {
            throw new Error('Environment validation failed: Mercado Pago configuration requires both MERCADOPAGO_ACCESS_TOKEN and MERCADOPAGO_WEBHOOK_SECRET');
        }
    }
    const hasCloudinaryValue = Boolean(value.CLOUDINARY_CLOUD_NAME) ||
        Boolean(value.CLOUDINARY_API_KEY) ||
        Boolean(value.CLOUDINARY_API_SECRET);
    if (hasCloudinaryValue) {
        if (!value.CLOUDINARY_CLOUD_NAME ||
            !value.CLOUDINARY_API_KEY ||
            !value.CLOUDINARY_API_SECRET) {
            throw new Error('Environment validation failed: Cloudinary configuration requires CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET');
        }
    }
    return value;
}
