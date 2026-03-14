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
var _a, _b;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CatalogController = void 0;
const common_1 = require("@nestjs/common");
const catalog_service_1 = require("./catalog.service");
const list_catalog_products_dto_1 = require("./dto/list-catalog-products.dto");
let CatalogController = class CatalogController {
    catalogService;
    constructor(catalogService) {
        this.catalogService = catalogService;
    }
    async listProducts(query) {
        const products = await this.catalogService.listProducts(query);
        return products.map((product) => this.mapStorefrontProduct(product));
    }
    async getProductBySlug(slug) {
        const product = await this.catalogService.findProductBySlug(slug);
        if (!product) {
            throw new common_1.NotFoundException(`Product ${slug} was not found`);
        }
        return this.mapStorefrontProduct(product);
    }
    mapStorefrontProduct(product) {
        return {
            id: product.id,
            slug: product.slug,
            name: product.name,
            description: product.description,
            status: product.status,
            variants: product.variants.map((variant) => ({
                id: variant.id,
                sku: variant.sku,
                name: variant.name,
                priceAmount: variant.priceAmount.toString(),
                currencyCode: variant.currencyCode,
            })),
            images: product.images.map((image) => ({
                id: image.id,
                assetUrl: image.assetUrl,
                assetKey: image.assetKey,
                altText: image.altText,
                sortOrder: image.sortOrder,
            })),
        };
    }
};
exports.CatalogController = CatalogController;
__decorate([
    (0, common_1.Get)('products'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_b = typeof list_catalog_products_dto_1.ListCatalogProductsDto !== "undefined" && list_catalog_products_dto_1.ListCatalogProductsDto) === "function" ? _b : Object]),
    __metadata("design:returntype", Promise)
], CatalogController.prototype, "listProducts", null);
__decorate([
    (0, common_1.Get)('products/:slug'),
    __param(0, (0, common_1.Param)('slug')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], CatalogController.prototype, "getProductBySlug", null);
exports.CatalogController = CatalogController = __decorate([
    (0, common_1.Controller)('catalog'),
    __metadata("design:paramtypes", [typeof (_a = typeof catalog_service_1.CatalogService !== "undefined" && catalog_service_1.CatalogService) === "function" ? _a : Object])
], CatalogController);
