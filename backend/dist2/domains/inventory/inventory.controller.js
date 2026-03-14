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
exports.InventoryController = void 0;
const common_1 = require("@nestjs/common");
const inventory_service_1 = require("./inventory.service");
const inventory_variant_params_dto_1 = require("./dto/inventory-variant-params.dto");
const update_inventory_dto_1 = require("./dto/update-inventory.dto");
let InventoryController = class InventoryController {
    inventoryService;
    constructor(inventoryService) {
        this.inventoryService = inventoryService;
    }
    async getInventory(params) {
        const inventory = await this.inventoryService.findByVariantId(params.variantId);
        if (!inventory) {
            throw new common_1.NotFoundException(`Inventory for variant ${params.variantId} was not found`);
        }
        return inventory;
    }
    updateInventory(params, body) {
        return this.inventoryService.updateAvailableQuantity(params.variantId, body.availableQuantity);
    }
};
exports.InventoryController = InventoryController;
__decorate([
    (0, common_1.Get)('variants/:variantId'),
    __param(0, (0, common_1.Param)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_b = typeof inventory_variant_params_dto_1.InventoryVariantParamsDto !== "undefined" && inventory_variant_params_dto_1.InventoryVariantParamsDto) === "function" ? _b : Object]),
    __metadata("design:returntype", Promise)
], InventoryController.prototype, "getInventory", null);
__decorate([
    (0, common_1.Patch)('variants/:variantId'),
    __param(0, (0, common_1.Param)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_c = typeof inventory_variant_params_dto_1.InventoryVariantParamsDto !== "undefined" && inventory_variant_params_dto_1.InventoryVariantParamsDto) === "function" ? _c : Object, typeof (_d = typeof update_inventory_dto_1.UpdateInventoryDto !== "undefined" && update_inventory_dto_1.UpdateInventoryDto) === "function" ? _d : Object]),
    __metadata("design:returntype", void 0)
], InventoryController.prototype, "updateInventory", null);
exports.InventoryController = InventoryController = __decorate([
    (0, common_1.Controller)('admin/inventory'),
    __metadata("design:paramtypes", [typeof (_a = typeof inventory_service_1.InventoryService !== "undefined" && inventory_service_1.InventoryService) === "function" ? _a : Object])
], InventoryController);
