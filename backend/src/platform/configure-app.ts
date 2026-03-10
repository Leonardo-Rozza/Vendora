import { INestApplication, ValidationPipe } from '@nestjs/common';
import { AppConfigService } from './config/app-config.service';
import { AppLoggerService } from './logging/app-logger.service';

export function configureApp(app: INestApplication): void {
  const config = app.get(AppConfigService);

  app.useLogger(app.get(AppLoggerService));
  app.setGlobalPrefix('api');
  app.enableShutdownHooks();
  app.enableCors({
    origin: config.frontendAppUrl ?? true,
    credentials: true,
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );
}
