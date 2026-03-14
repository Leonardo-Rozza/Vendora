"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PlatformModule = void 0;
const common_1 = require("@nestjs/common");
const platform_config_module_1 = require("./config/platform-config.module");
const health_module_1 = require("./health/health.module");
const app_logger_module_1 = require("./logging/app-logger.module");
const media_module_1 = require("./media/media.module");
const prisma_module_1 = require("./prisma/prisma.module");
const providers_module_1 = require("./providers/providers.module");
let PlatformModule = class PlatformModule {
};
exports.PlatformModule = PlatformModule;
exports.PlatformModule = PlatformModule = __decorate([
    (0, common_1.Module)({
        imports: [
            platform_config_module_1.PlatformConfigModule,
            app_logger_module_1.AppLoggerModule,
            providers_module_1.ProvidersModule,
            prisma_module_1.PrismaModule,
            health_module_1.HealthModule,
            media_module_1.MediaModule,
        ],
        exports: [
            platform_config_module_1.PlatformConfigModule,
            app_logger_module_1.AppLoggerModule,
            providers_module_1.ProvidersModule,
            prisma_module_1.PrismaModule,
        ],
    })
], PlatformModule);
