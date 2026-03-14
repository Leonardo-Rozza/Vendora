"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppConfigService = exports.ConfigurationUnavailableError = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
class ConfigurationUnavailableError extends Error {
    constructor(capability, reason) {
        super(`${capability} is not configured: ${reason}`);
    }
}
exports.ConfigurationUnavailableError = ConfigurationUnavailableError;
let AppConfigService = class AppConfigService {
    configService;
    constructor(configService) {
        this.configService = configService;
    }
    get appName() {
        return this.getOrDefault('APP_NAME', 'vendora-backend');
    }
    get environment() {
        return this.getOrDefault('NODE_ENV', 'development');
    }
    get port() {
        return Number(this.getOrDefault('PORT', '3000'));
    }
    get frontendAppUrl() {
        return this.configService.get('FRONTEND_APP_URL') ?? null;
    }
    get databaseStatus() {
        const databaseUrl = this.configService.get('DATABASE_URL');
        if (!databaseUrl) {
            return {
                configured: false,
                reason: 'Missing DATABASE_URL',
            };
        }
        return { configured: true };
    }
    get mercadoPagoStatus() {
        const accessToken = this.configService.get('MERCADOPAGO_ACCESS_TOKEN');
        const webhookSecret = this.configService.get('MERCADOPAGO_WEBHOOK_SECRET');
        if (!accessToken && !webhookSecret) {
            return {
                configured: false,
                reason: 'Missing MERCADOPAGO_ACCESS_TOKEN and MERCADOPAGO_WEBHOOK_SECRET',
            };
        }
        if (!accessToken || !webhookSecret) {
            return {
                configured: false,
                reason: 'Mercado Pago requires both MERCADOPAGO_ACCESS_TOKEN and MERCADOPAGO_WEBHOOK_SECRET',
            };
        }
        return { configured: true };
    }
    get cloudinaryStatus() {
        const cloudName = this.configService.get('CLOUDINARY_CLOUD_NAME');
        const apiKey = this.configService.get('CLOUDINARY_API_KEY');
        const apiSecret = this.configService.get('CLOUDINARY_API_SECRET');
        if (!cloudName && !apiKey && !apiSecret) {
            return {
                configured: false,
                reason: 'Missing Cloudinary credentials',
            };
        }
        if (!cloudName || !apiKey || !apiSecret) {
            return {
                configured: false,
                reason: 'Cloudinary requires CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET',
            };
        }
        return { configured: true };
    }
    getCapabilitySummary() {
        return {
            database: this.databaseStatus,
            mercadoPago: this.mercadoPagoStatus,
            cloudinary: this.cloudinaryStatus,
        };
    }
    requireDatabaseUrl() {
        const status = this.databaseStatus;
        if (!status.configured) {
            throw new ConfigurationUnavailableError('database', status.reason ?? 'Unknown reason');
        }
        return this.configService.getOrThrow('DATABASE_URL');
    }
    requireMercadoPagoConfig() {
        const status = this.mercadoPagoStatus;
        if (!status.configured) {
            throw new ConfigurationUnavailableError('mercadoPago', status.reason ?? 'Unknown reason');
        }
        return {
            accessToken: this.configService.getOrThrow('MERCADOPAGO_ACCESS_TOKEN'),
            webhookSecret: this.configService.getOrThrow('MERCADOPAGO_WEBHOOK_SECRET'),
        };
    }
    requireCloudinaryConfig() {
        const status = this.cloudinaryStatus;
        if (!status.configured) {
            throw new ConfigurationUnavailableError('cloudinary', status.reason ?? 'Unknown reason');
        }
        return {
            cloudName: this.configService.getOrThrow('CLOUDINARY_CLOUD_NAME'),
            apiKey: this.configService.getOrThrow('CLOUDINARY_API_KEY'),
            apiSecret: this.configService.getOrThrow('CLOUDINARY_API_SECRET'),
        };
    }
    getOrDefault(key, fallback) {
        return this.configService.get(key) ?? fallback;
    }
};
exports.AppConfigService = AppConfigService;
exports.AppConfigService = AppConfigService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [typeof (_a = typeof config_1.ConfigService !== "undefined" && config_1.ConfigService) === "function" ? _a : Object])
], AppConfigService);
