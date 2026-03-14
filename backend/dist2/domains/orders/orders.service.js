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
var _a, _b;
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrdersService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const inventory_service_1 = require("../inventory/inventory.service");
const prisma_service_1 = require("../../platform/prisma/prisma.service");
let OrdersService = class OrdersService {
    prisma;
    inventoryService;
    constructor(prisma, inventoryService) {
        this.prisma = prisma;
        this.inventoryService = inventoryService;
    }
    findOrderById(id) {
        return this.prisma.order.findUnique({
            where: { id },
            include: {
                items: true,
                payments: true,
                user: true,
            },
        });
    }
    listOrders(status) {
        return this.prisma.order.findMany({
            where: status ? { status } : undefined,
            include: {
                items: true,
                payments: true,
                user: true,
            },
            orderBy: {
                createdAt: 'desc',
            },
        });
    }
    async createOrder(input) {
        const aggregatedItems = this.aggregateItems(input.items);
        const variantIds = aggregatedItems.map((item) => item.variantId);
        const variants = await this.prisma.productVariant.findMany({
            where: {
                id: {
                    in: variantIds,
                },
            },
            include: {
                product: true,
                inventoryItem: true,
            },
        });
        if (variants.length !== variantIds.length) {
            throw new common_1.NotFoundException('One or more variants were not found');
        }
        const variantMap = new Map(variants.map((variant) => [variant.id, variant]));
        for (const item of aggregatedItems) {
            const variant = variantMap.get(item.variantId);
            if (!variant) {
                throw new common_1.NotFoundException(`Variant ${item.variantId} was not found`);
            }
            if (variant.product.status !== client_1.ProductStatus.ACTIVE) {
                throw new common_1.ConflictException(`Variant ${item.variantId} is not available for purchase`);
            }
            if (!variant.inventoryItem) {
                throw new common_1.ConflictException(`Variant ${item.variantId} does not have inventory configured`);
            }
        }
        const currencyCodes = new Set(aggregatedItems.map((item) => variantMap.get(item.variantId).currencyCode));
        if (currencyCodes.size !== 1) {
            throw new common_1.BadRequestException('Cart items must use the same currency');
        }
        const currencyCode = [...currencyCodes][0];
        const subtotalAmount = aggregatedItems.reduce((total, item) => {
            const variant = variantMap.get(item.variantId);
            return total.plus(variant.priceAmount.mul(item.quantity));
        }, new client_1.Prisma.Decimal(0));
        return this.prisma.$transaction(async (client) => {
            await this.inventoryService.reserveItems(client, aggregatedItems);
            return client.order.create({
                data: {
                    userId: input.userId,
                    status: client_1.OrderStatus.PENDING_PAYMENT,
                    currencyCode,
                    subtotalAmount,
                    totalAmount: subtotalAmount,
                    items: {
                        create: aggregatedItems.map((item) => {
                            const variant = variantMap.get(item.variantId);
                            return {
                                variantId: item.variantId,
                                productName: variant.product.name,
                                variantName: variant.name,
                                sku: variant.sku,
                                unitPriceAmount: variant.priceAmount,
                                quantity: item.quantity,
                            };
                        }),
                    },
                },
                include: {
                    items: true,
                    payments: true,
                    user: true,
                },
            });
        });
    }
    async cancelOrder(orderId) {
        const order = await this.prisma.order.findUnique({
            where: { id: orderId },
            include: {
                items: true,
                payments: true,
                user: true,
            },
        });
        if (!order) {
            throw new common_1.NotFoundException(`Order ${orderId} was not found`);
        }
        if (order.status === client_1.OrderStatus.PAID || order.isLocked) {
            throw new common_1.ConflictException(`Order ${orderId} can no longer be changed`);
        }
        if (order.status === client_1.OrderStatus.CANCELLED) {
            return order;
        }
        return this.prisma.$transaction(async (client) => {
            await this.inventoryService.releaseReservationForOrder(client, orderId);
            return client.order.update({
                where: { id: orderId },
                data: {
                    status: client_1.OrderStatus.CANCELLED,
                },
                include: {
                    items: true,
                    payments: true,
                    user: true,
                },
            });
        });
    }
    aggregateItems(items) {
        const itemsByVariantId = new Map();
        for (const item of items) {
            itemsByVariantId.set(item.variantId, (itemsByVariantId.get(item.variantId) ?? 0) + item.quantity);
        }
        return [...itemsByVariantId.entries()].map(([variantId, quantity]) => ({
            variantId,
            quantity,
        }));
    }
};
exports.OrdersService = OrdersService;
exports.OrdersService = OrdersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [typeof (_a = typeof prisma_service_1.PrismaService !== "undefined" && prisma_service_1.PrismaService) === "function" ? _a : Object, typeof (_b = typeof inventory_service_1.InventoryService !== "undefined" && inventory_service_1.InventoryService) === "function" ? _b : Object])
], OrdersService);
