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
var _a, _b, _c, _d;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminCatalogController = void 0;
const common_1 = require("@nestjs/common");
const catalog_service_1 = require("./catalog.service");
const create_product_dto_1 = require("./dto/create-product.dto");
const list_admin_products_dto_1 = require("./dto/list-admin-products.dto");
const update_product_dto_1 = require("./dto/update-product.dto");
let AdminCatalogController = class AdminCatalogController {
    catalogService;
    constructor(catalogService) {
        this.catalogService = catalogService;
    }
    listProducts(query) {
        return this.catalogService.listAdminProducts(query);
    }
    async getProduct(productId) {
        const product = await this.catalogService.findAdminProductById(productId);
        if (!product) {
            throw new common_1.NotFoundException(`Product ${productId} was not found`);
        }
        return product;
    }
    createProduct(body) {
        return this.catalogService.createProduct(body);
    }
    async updateProduct(productId, body) {
        const product = await this.catalogService.updateProduct(productId, body);
        if (!product) {
            throw new common_1.NotFoundException(`Product ${productId} was not found`);
        }
        return product;
    }
};
exports.AdminCatalogController = AdminCatalogController;
__decorate([
    (0, common_1.Get)('products'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_b = typeof list_admin_products_dto_1.ListAdminProductsDto !== "undefined" && list_admin_products_dto_1.ListAdminProductsDto) === "function" ? _b : Object]),
    __metadata("design:returntype", void 0)
], AdminCatalogController.prototype, "listProducts", null);
__decorate([
    (0, common_1.Get)('products/:productId'),
    __param(0, (0, common_1.Param)('productId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdminCatalogController.prototype, "getProduct", null);
__decorate([
    (0, common_1.Post)('products'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_c = typeof create_product_dto_1.CreateProductDto !== "undefined" && create_product_dto_1.CreateProductDto) === "function" ? _c : Object]),
    __metadata("design:returntype", void 0)
], AdminCatalogController.prototype, "createProduct", null);
__decorate([
    (0, common_1.Patch)('products/:productId'),
    __param(0, (0, common_1.Param)('productId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, typeof (_d = typeof update_product_dto_1.UpdateProductDto !== "undefined" && update_product_dto_1.UpdateProductDto) === "function" ? _d : Object]),
    __metadata("design:returntype", Promise)
], AdminCatalogController.prototype, "updateProduct", null);
exports.AdminCatalogController = AdminCatalogController = __decorate([
    (0, common_1.Controller)('admin/catalog'),
    __metadata("design:paramtypes", [typeof (_a = typeof catalog_service_1.CatalogService !== "undefined" && catalog_service_1.CatalogService) === "function" ? _a : Object])
], AdminCatalogController);
