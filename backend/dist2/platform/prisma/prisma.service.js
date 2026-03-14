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
exports.PrismaService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const app_config_service_1 = require("../config/app-config.service");
let PrismaService = class PrismaService {
    isDatabaseConfigured;
    client;
    constructor(config) {
        const databaseStatus = config.databaseStatus;
        this.client = new client_1.PrismaClient({
            datasources: databaseStatus.configured
                ? {
                    db: {
                        url: config.requireDatabaseUrl(),
                    },
                }
                : undefined,
            log: ['warn', 'error'],
        });
        this.isDatabaseConfigured = databaseStatus.configured;
    }
    async onModuleInit() {
        if (!this.isDatabaseConfigured) {
            return;
        }
        await this.client.$connect();
    }
    async onModuleDestroy() {
        if (!this.isDatabaseConfigured) {
            return;
        }
        await this.client.$disconnect();
    }
    async $transaction(callback) {
        return this.client.$transaction((transactionClient) => callback(transactionClient));
    }
    get product() {
        return this.client.product;
    }
    get inventoryItem() {
        return this.client.inventoryItem;
    }
    get productVariant() {
        return this.client.productVariant;
    }
    get productImage() {
        return this.client.productImage;
    }
    get order() {
        return this.client.order;
    }
    get orderItem() {
        return this.client.orderItem;
    }
    get payment() {
        return this.client.payment;
    }
    get paymentWebhookDelivery() {
        return this.client.paymentWebhookDelivery;
    }
    get user() {
        return this.client.user;
    }
};
exports.PrismaService = PrismaService;
exports.PrismaService = PrismaService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [typeof (_a = typeof app_config_service_1.AppConfigService !== "undefined" && app_config_service_1.AppConfigService) === "function" ? _a : Object])
], PrismaService);
