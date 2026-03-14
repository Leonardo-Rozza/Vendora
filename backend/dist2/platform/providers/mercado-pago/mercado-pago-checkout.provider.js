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
exports.MercadoPagoCheckoutProvider = void 0;
const common_1 = require("@nestjs/common");
const app_config_service_1 = require("../../config/app-config.service");
let MercadoPagoCheckoutProvider = class MercadoPagoCheckoutProvider {
    appConfigService;
    constructor(appConfigService) {
        this.appConfigService = appConfigService;
    }
    async createCheckoutPreference(input) {
        this.appConfigService.requireMercadoPagoConfig();
        const preferenceId = `pref_${input.orderId}`;
        const frontendAppUrl = this.appConfigService.frontendAppUrl?.replace(/\/$/, '');
        return {
            provider: 'mercado-pago',
            preferenceId,
            initPoint: `https://www.mercadopago.com/checkout/v1/redirect?pref_id=${preferenceId}`,
            externalReference: input.orderId,
            payerEmail: input.payerEmail,
            currencyCode: input.currencyCode,
            notificationPath: '/api/payments/webhooks/mercado-pago',
            ...(frontendAppUrl
                ? {
                    backUrls: {
                        success: `${frontendAppUrl}/checkout/success`,
                        pending: `${frontendAppUrl}/checkout/pending`,
                        failure: `${frontendAppUrl}/checkout/failure`,
                    },
                    autoReturn: 'approved',
                }
                : {}),
        };
    }
};
exports.MercadoPagoCheckoutProvider = MercadoPagoCheckoutProvider;
exports.MercadoPagoCheckoutProvider = MercadoPagoCheckoutProvider = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [typeof (_a = typeof app_config_service_1.AppConfigService !== "undefined" && app_config_service_1.AppConfigService) === "function" ? _a : Object])
], MercadoPagoCheckoutProvider);
