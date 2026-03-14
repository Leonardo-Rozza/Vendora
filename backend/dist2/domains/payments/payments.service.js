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
var _a, _b, _c, _d;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentsService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const inventory_service_1 = require("../inventory/inventory.service");
const app_logger_service_1 = require("../../platform/logging/app-logger.service");
const prisma_service_1 = require("../../platform/prisma/prisma.service");
const mercado_pago_checkout_provider_1 = require("../../platform/providers/mercado-pago/mercado-pago-checkout.provider");
const MERCADO_PAGO_PROVIDER = 'mercado-pago';
let PaymentsService = class PaymentsService {
    prisma;
    mercadoPagoCheckoutProvider;
    logger;
    inventoryService;
    constructor(prisma, mercadoPagoCheckoutProvider, logger, inventoryService) {
        this.prisma = prisma;
        this.mercadoPagoCheckoutProvider = mercadoPagoCheckoutProvider;
        this.logger = logger;
        this.inventoryService = inventoryService;
    }
    findByProviderPaymentId(providerPaymentId) {
        return this.prisma.payment.findFirst({
            where: {
                provider: MERCADO_PAGO_PROVIDER,
                providerPaymentId,
            },
            include: {
                order: true,
                webhookDeliveries: true,
            },
        });
    }
    async createCheckoutPreference(input) {
        const order = await this.prisma.order.findUnique({
            where: { id: input.orderId },
            include: {
                items: true,
                payments: true,
            },
        });
        if (!order) {
            throw new common_1.NotFoundException(`Order ${input.orderId} was not found`);
        }
        if (order.status === 'PAID' || order.isLocked) {
            throw new common_1.ConflictException(`Order ${input.orderId} can no longer be changed`);
        }
        const checkoutPreference = await this.mercadoPagoCheckoutProvider.createCheckoutPreference({
            orderId: order.id,
            currencyCode: order.currencyCode,
            payerEmail: input.payerEmail,
            items: order.items.map((item) => ({
                sku: item.sku,
                title: item.productName,
                quantity: item.quantity,
                unitPriceAmount: item.unitPriceAmount.toString(),
            })),
        });
        const payment = await this.prisma.payment.create({
            data: {
                orderId: order.id,
                provider: MERCADO_PAGO_PROVIDER,
                providerPreferenceId: checkoutPreference.preferenceId,
                rawPayload: checkoutPreference,
                status: 'PENDING',
            },
        });
        this.logger.logPaymentEvent('payment.checkout_preference.created', {
            orderId: order.id,
            paymentId: payment.id,
            preferenceId: checkoutPreference.preferenceId,
        });
        return {
            orderId: order.id,
            paymentId: payment.id,
            provider: checkoutPreference.provider,
            preferenceId: checkoutPreference.preferenceId,
            initPoint: checkoutPreference.initPoint,
            payerEmail: input.payerEmail,
        };
    }
    async handleMercadoPagoWebhook(input) {
        this.logger.logWebhookEvent('payment.webhook.received', {
            eventId: input.eventId,
            resourceId: input.resourceId,
            topic: input.topic,
        });
        let delivery;
        try {
            delivery = await this.prisma.paymentWebhookDelivery.create({
                data: {
                    provider: MERCADO_PAGO_PROVIDER,
                    providerEventId: input.eventId,
                    topic: input.topic,
                    payload: input,
                    status: 'PROCESSING',
                },
            });
        }
        catch (error) {
            if (this.isDuplicateWebhook(error)) {
                this.logger.logWebhookEvent('payment.webhook.duplicate', {
                    eventId: input.eventId,
                });
                return { status: 'duplicate' };
            }
            throw error;
        }
        const payment = await this.prisma.payment.findFirst({
            where: {
                provider: MERCADO_PAGO_PROVIDER,
                providerPaymentId: input.resourceId,
            },
            include: {
                order: true,
            },
        });
        if (!payment) {
            await this.prisma.paymentWebhookDelivery.update({
                where: { id: delivery.id },
                data: {
                    processedAt: this.getNow(),
                    status: 'IGNORED',
                },
            });
            return { status: 'ignored' };
        }
        const paymentStatus = this.mapWebhookStatus(input.status);
        const processedAt = this.getNow();
        if (!this.shouldApplyWebhookStatus(payment.status, paymentStatus)) {
            await this.prisma.paymentWebhookDelivery.update({
                where: { id: delivery.id },
                data: {
                    paymentId: payment.id,
                    processedAt,
                    status: 'IGNORED',
                },
            });
            this.logger.logWebhookEvent('payment.webhook.ignored_transition', {
                eventId: input.eventId,
                orderId: payment.orderId,
                paymentId: payment.id,
                currentStatus: payment.status,
                attemptedStatus: paymentStatus,
            });
            return {
                status: 'ignored',
                orderId: payment.orderId,
                paymentId: payment.id,
                paymentStatus: payment.status,
            };
        }
        await this.prisma.$transaction(async (transactionClient) => {
            await transactionClient.payment.update({
                where: { id: payment.id },
                data: {
                    rawPayload: input,
                    status: paymentStatus,
                    ...(paymentStatus === 'APPROVED' ? { confirmedAt: processedAt } : {}),
                },
            });
            if (paymentStatus === 'APPROVED' &&
                (!payment.order.isLocked || payment.order.status !== 'PAID')) {
                await this.inventoryService.consumeReservationForOrder(transactionClient, payment.orderId);
                await transactionClient.order.update({
                    where: { id: payment.orderId },
                    data: {
                        isLocked: true,
                        paidAt: processedAt,
                        status: 'PAID',
                    },
                });
            }
            await transactionClient.paymentWebhookDelivery.update({
                where: { id: delivery.id },
                data: {
                    paymentId: payment.id,
                    processedAt,
                    status: 'PROCESSED',
                },
            });
        });
        this.logger.logPaymentEvent('payment.webhook.processed', {
            eventId: input.eventId,
            orderId: payment.orderId,
            paymentId: payment.id,
            paymentStatus,
        });
        return {
            status: 'processed',
            orderId: payment.orderId,
            paymentId: payment.id,
            paymentStatus,
        };
    }
    isDuplicateWebhook(error) {
        return (error instanceof client_1.Prisma.PrismaClientKnownRequestError &&
            error.code === 'P2002');
    }
    mapWebhookStatus(status) {
        switch (status) {
            case 'approved':
                return 'APPROVED';
            case 'authorized':
                return 'AUTHORIZED';
            case 'rejected':
                return 'REJECTED';
            case 'cancelled':
                return 'CANCELLED';
            case 'refunded':
                return 'REFUNDED';
            default:
                return 'PENDING';
        }
    }
    shouldApplyWebhookStatus(currentStatus, nextStatus) {
        if (currentStatus === nextStatus) {
            return !this.isTerminalPaymentStatus(currentStatus);
        }
        if (currentStatus === 'APPROVED') {
            return nextStatus === 'REFUNDED';
        }
        if (this.isTerminalPaymentStatus(currentStatus)) {
            return false;
        }
        return true;
    }
    isTerminalPaymentStatus(status) {
        return (status === 'APPROVED' ||
            status === 'REJECTED' ||
            status === 'CANCELLED' ||
            status === 'REFUNDED');
    }
    getNow() {
        return new Date();
    }
};
exports.PaymentsService = PaymentsService;
exports.PaymentsService = PaymentsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [typeof (_a = typeof prisma_service_1.PrismaService !== "undefined" && prisma_service_1.PrismaService) === "function" ? _a : Object, typeof (_b = typeof mercado_pago_checkout_provider_1.MercadoPagoCheckoutProvider !== "undefined" && mercado_pago_checkout_provider_1.MercadoPagoCheckoutProvider) === "function" ? _b : Object, typeof (_c = typeof app_logger_service_1.AppLoggerService !== "undefined" && app_logger_service_1.AppLoggerService) === "function" ? _c : Object, typeof (_d = typeof inventory_service_1.InventoryService !== "undefined" && inventory_service_1.InventoryService) === "function" ? _d : Object])
], PaymentsService);
