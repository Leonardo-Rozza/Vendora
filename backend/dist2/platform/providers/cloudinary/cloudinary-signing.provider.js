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
exports.CloudinarySigningProvider = void 0;
const node_crypto_1 = require("node:crypto");
const common_1 = require("@nestjs/common");
const app_config_service_1 = require("../../config/app-config.service");
let CloudinarySigningProvider = class CloudinarySigningProvider {
    appConfigService;
    constructor(appConfigService) {
        this.appConfigService = appConfigService;
    }
    createProductImageUploadSignature(input) {
        const config = this.appConfigService.requireCloudinaryConfig();
        const timestamp = input.timestamp ?? Math.floor(Date.now() / 1000);
        const folder = `vendora/products/${input.productId}`;
        const signature = (0, node_crypto_1.createHash)('sha1')
            .update(`folder=${folder}&timestamp=${timestamp}${config.apiSecret}`)
            .digest('hex');
        return {
            cloudName: config.cloudName,
            apiKey: config.apiKey,
            folder,
            timestamp,
            signature,
        };
    }
};
exports.CloudinarySigningProvider = CloudinarySigningProvider;
exports.CloudinarySigningProvider = CloudinarySigningProvider = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [typeof (_a = typeof app_config_service_1.AppConfigService !== "undefined" && app_config_service_1.AppConfigService) === "function" ? _a : Object])
], CloudinarySigningProvider);
