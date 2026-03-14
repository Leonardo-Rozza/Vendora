"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.configureApp = configureApp;
const pipes_1 = require("@nestjs/common/pipes");
const app_config_service_1 = require("./config/app-config.service");
const app_logger_service_1 = require("./logging/app-logger.service");
function configureApp(app) {
    const config = app.get(app_config_service_1.AppConfigService);
    app.useLogger(app.get(app_logger_service_1.AppLoggerService));
    app.setGlobalPrefix('api');
    app.enableShutdownHooks();
    app.enableCors({
        origin: config.frontendAppUrl ?? true,
        credentials: true,
    });
    app.useGlobalPipes(new pipes_1.ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: {
            enableImplicitConversion: true,
        },
    }));
}
