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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var _a, _b, _c;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentsController = void 0;
const common_1 = require("@nestjs/common");
const create_checkout_preference_dto_1 = require("./dto/create-checkout-preference.dto");
const mercado_pago_webhook_dto_1 = require("./dto/mercado-pago-webhook.dto");
const payments_service_1 = require("./payments.service");
let PaymentsController = class PaymentsController {
    paymentsService;
    constructor(paymentsService) {
        this.paymentsService = paymentsService;
    }
    createCheckoutPreference(body) {
        return this.paymentsService.createCheckoutPreference(body);
    }
    handleMercadoPagoWebhook(body) {
        return this.paymentsService.handleMercadoPagoWebhook(body);
    }
};
exports.PaymentsController = PaymentsController;
__decorate([
    (0, common_1.Post)('checkout-preferences'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_b = typeof create_checkout_preference_dto_1.CreateCheckoutPreferenceDto !== "undefined" && create_checkout_preference_dto_1.CreateCheckoutPreferenceDto) === "function" ? _b : Object]),
    __metadata("design:returntype", void 0)
], PaymentsController.prototype, "createCheckoutPreference", null);
__decorate([
    (0, common_1.Post)('webhooks/mercado-pago'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_c = typeof mercado_pago_webhook_dto_1.MercadoPagoWebhookDto !== "undefined" && mercado_pago_webhook_dto_1.MercadoPagoWebhookDto) === "function" ? _c : Object]),
    __metadata("design:returntype", void 0)
], PaymentsController.prototype, "handleMercadoPagoWebhook", null);
exports.PaymentsController = PaymentsController = __decorate([
    (0, common_1.Controller)('payments'),
    __metadata("design:paramtypes", [typeof (_a = typeof payments_service_1.PaymentsService !== "undefined" && payments_service_1.PaymentsService) === "function" ? _a : Object])
], PaymentsController);
