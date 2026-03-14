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
exports.CatalogService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../../platform/prisma/prisma.service");
const PRODUCT_INCLUDE = {
    variants: {
        include: {
            inventoryItem: true,
        },
    },
    images: {
        orderBy: {
            sortOrder: 'asc',
        },
    },
};
let CatalogService = class CatalogService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    listProducts(query) {
        return this.prisma.product.findMany({
            where: this.buildProductWhere({
                query: query.query,
                status: client_1.ProductStatus.ACTIVE,
            }),
            include: PRODUCT_INCLUDE,
            orderBy: {
                createdAt: 'desc',
            },
        });
    }
    findProductBySlug(slug) {
        return this.prisma.product.findFirst({
            where: {
                slug,
                status: client_1.ProductStatus.ACTIVE,
            },
            include: PRODUCT_INCLUDE,
        });
    }
    listAdminProducts(query) {
        return this.prisma.product.findMany({
            where: this.buildProductWhere(query),
            include: PRODUCT_INCLUDE,
            orderBy: {
                createdAt: 'desc',
            },
        });
    }
    findAdminProductById(productId) {
        return this.prisma.product.findUnique({
            where: { id: productId },
            include: PRODUCT_INCLUDE,
        });
    }
    async createProduct(input) {
        return this.prisma.product.create({
            data: {
                slug: input.slug,
                name: input.name,
                description: input.description,
                status: input.status,
                variants: {
                    create: input.variants.map((variant) => ({
                        sku: variant.sku,
                        name: variant.name,
                        priceAmount: new client_1.Prisma.Decimal(variant.priceAmount),
                        currencyCode: variant.currencyCode.toUpperCase(),
                        inventoryItem: variant.availableQuantity !== undefined
                            ? {
                                create: {
                                    availableQuantity: variant.availableQuantity,
                                },
                            }
                            : undefined,
                    })),
                },
                images: input.images
                    ? {
                        create: input.images.map((image) => ({
                            assetUrl: image.assetUrl,
                            assetKey: image.assetKey,
                            altText: image.altText,
                            sortOrder: image.sortOrder,
                        })),
                    }
                    : undefined,
            },
            include: PRODUCT_INCLUDE,
        });
    }
    async updateProduct(productId, input) {
        return this.prisma.$transaction(async (client) => {
            const existing = await client.product.findUnique({
                where: { id: productId },
                include: {
                    variants: true,
                },
            });
            if (!existing) {
                return null;
            }
            await client.product.update({
                where: { id: productId },
                data: {
                    slug: input.slug,
                    name: input.name,
                    description: input.description,
                    status: input.status,
                },
            });
            if (input.images) {
                await client.productImage.deleteMany({
                    where: { productId },
                });
                if (input.images.length > 0) {
                    await client.productImage.createMany({
                        data: input.images.map((image) => ({
                            productId,
                            assetUrl: image.assetUrl,
                            assetKey: image.assetKey,
                            altText: image.altText,
                            sortOrder: image.sortOrder,
                        })),
                    });
                }
            }
            if (input.variants) {
                for (const variant of input.variants) {
                    if (variant.id) {
                        const variantExists = existing.variants.some((existingVariant) => existingVariant.id === variant.id);
                        if (!variantExists) {
                            throw new Error(`Variant ${variant.id} does not belong to product ${productId}`);
                        }
                        await client.productVariant.update({
                            where: { id: variant.id },
                            data: {
                                sku: variant.sku,
                                name: variant.name,
                                priceAmount: new client_1.Prisma.Decimal(variant.priceAmount),
                                currencyCode: variant.currencyCode.toUpperCase(),
                            },
                        });
                        if (variant.availableQuantity !== undefined) {
                            await this.upsertInventory(client, variant.id, variant.availableQuantity);
                        }
                        continue;
                    }
                    const createdVariant = await client.productVariant.create({
                        data: {
                            productId,
                            sku: variant.sku,
                            name: variant.name,
                            priceAmount: new client_1.Prisma.Decimal(variant.priceAmount),
                            currencyCode: variant.currencyCode.toUpperCase(),
                        },
                    });
                    if (variant.availableQuantity !== undefined) {
                        await client.inventoryItem.create({
                            data: {
                                variantId: createdVariant.id,
                                availableQuantity: variant.availableQuantity,
                            },
                        });
                    }
                }
            }
            return this.findProductByIdWithClient(client, productId);
        });
    }
    async findProductByIdWithClient(client, productId) {
        return client.product.findUnique({
            where: { id: productId },
            include: PRODUCT_INCLUDE,
        });
    }
    buildProductWhere({ query, status, }) {
        const normalizedQuery = query?.trim();
        return {
            ...(status ? { status } : {}),
            ...(normalizedQuery
                ? {
                    OR: [
                        {
                            name: {
                                contains: normalizedQuery,
                                mode: 'insensitive',
                            },
                        },
                        {
                            slug: {
                                contains: normalizedQuery,
                                mode: 'insensitive',
                            },
                        },
                        {
                            variants: {
                                some: {
                                    sku: {
                                        contains: normalizedQuery,
                                        mode: 'insensitive',
                                    },
                                },
                            },
                        },
                    ],
                }
                : {}),
        };
    }
    async upsertInventory(client, variantId, availableQuantity) {
        const existingInventory = await client.inventoryItem.findUnique({
            where: { variantId },
        });
        if (existingInventory) {
            await client.inventoryItem.update({
                where: { variantId },
                data: {
                    availableQuantity,
                },
            });
            return;
        }
        await client.inventoryItem.create({
            data: {
                variantId,
                availableQuantity,
            },
        });
    }
};
exports.CatalogService = CatalogService;
exports.CatalogService = CatalogService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [typeof (_a = typeof prisma_service_1.PrismaService !== "undefined" && prisma_service_1.PrismaService) === "function" ? _a : Object])
], CatalogService);
