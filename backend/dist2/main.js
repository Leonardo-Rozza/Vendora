"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const app_module_1 = require("./app.module");
const app_config_service_1 = require("./platform/config/app-config.service");
const configure_app_1 = require("./platform/configure-app");
const app_logger_service_1 = require("./platform/logging/app-logger.service");
async function bootstrap() {
    console.log('bootstrap:start');
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    console.log('bootstrap:created');
    (0, configure_app_1.configureApp)(app);
    console.log('bootstrap:configured');
    const config = app.get(app_config_service_1.AppConfigService);
    const logger = app.get(app_logger_service_1.AppLoggerService);
    const port = config.port;
    await app.listen(port);
    console.log('bootstrap:listening', port);
    logger.logApplicationEvent('application.started', {
        port,
        environment: config.environment,
    });
}
void bootstrap();
