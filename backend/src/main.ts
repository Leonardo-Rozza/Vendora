import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { AppConfigService } from './platform/config/app-config.service';
import { configureApp } from './platform/configure-app';
import { AppLoggerService } from './platform/logging/app-logger.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  configureApp(app);

  const config = app.get(AppConfigService);
  const logger = app.get(AppLoggerService);
  const port = config.port;

  await app.listen(port);
  logger.logApplicationEvent('application.started', {
    port,
    environment: config.environment,
  });
}

void bootstrap();
