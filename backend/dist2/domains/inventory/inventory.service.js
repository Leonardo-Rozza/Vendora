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
exports.InventoryService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../platform/prisma/prisma.service");
let InventoryService = class InventoryService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    findByVariantId(variantId) {
        return this.prisma.inventoryItem.findUnique({
            where: { variantId },
            include: {
                variant: {
                    include: {
                        product: true,
                    },
                },
            },
        });
    }
    async updateAvailableQuantity(variantId, availableQuantity) {
        const inventory = await this.prisma.inventoryItem.findUnique({
            where: { variantId },
        });
        if (inventory) {
            if (availableQuantity < inventory.reservedQuantity) {
                throw new common_1.BadRequestException('Available quantity cannot be lower than reserved quantity');
            }
            return this.prisma.inventoryItem.update({
                where: { variantId },
                data: {
                    availableQuantity,
                },
                include: {
                    variant: true,
                },
            });
        }
        const variant = await this.prisma.productVariant.findUnique({
            where: { id: variantId },
        });
        if (!variant) {
            throw new common_1.NotFoundException(`Variant ${variantId} was not found`);
        }
        return this.prisma.inventoryItem.create({
            data: {
                variantId,
                availableQuantity,
            },
            include: {
                variant: true,
            },
        });
    }
    async reserveItems(client, items) {
        for (const item of items) {
            const result = await client.inventoryItem.updateMany({
                where: {
                    variantId: item.variantId,
                    availableQuantity: {
                        gte: item.quantity,
                    },
                },
                data: {
                    availableQuantity: {
                        decrement: item.quantity,
                    },
                    reservedQuantity: {
                        increment: item.quantity,
                    },
                },
            });
            if (result.count === 0) {
                throw new common_1.ConflictException(`Variant ${item.variantId} does not have enough available stock`);
            }
        }
    }
    async releaseReservationForOrder(client, orderId) {
        const items = await this.getOrderItems(client, orderId);
        for (const item of items) {
            const result = await client.inventoryItem.updateMany({
                where: {
                    variantId: item.variantId,
                    reservedQuantity: {
                        gte: item.quantity,
                    },
                },
                data: {
                    availableQuantity: {
                        increment: item.quantity,
                    },
                    reservedQuantity: {
                        decrement: item.quantity,
                    },
                },
            });
            if (result.count === 0) {
                throw new common_1.ConflictException(`Variant ${item.variantId} does not have a matching reservation to release`);
            }
        }
    }
    async consumeReservationForOrder(client, orderId) {
        const items = await this.getOrderItems(client, orderId);
        for (const item of items) {
            const result = await client.inventoryItem.updateMany({
                where: {
                    variantId: item.variantId,
                    reservedQuantity: {
                        gte: item.quantity,
                    },
                },
                data: {
                    reservedQuantity: {
                        decrement: item.quantity,
                    },
                },
            });
            if (result.count === 0) {
                throw new common_1.ConflictException(`Variant ${item.variantId} does not have a matching reservation to consume`);
            }
        }
    }
    getOrderItems(client, orderId) {
        return client.orderItem.findMany({
            where: { orderId },
            select: {
                variantId: true,
                quantity: true,
            },
        });
    }
};
exports.InventoryService = InventoryService;
exports.InventoryService = InventoryService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [typeof (_a = typeof prisma_service_1.PrismaService !== "undefined" && prisma_service_1.PrismaService) === "function" ? _a : Object])
], InventoryService);
