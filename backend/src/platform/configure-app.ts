import { ValidationPipe } from '@nestjs/common/pipes';
import type { INestApplication } from '@nestjs/common';
import cookieParser from 'cookie-parser';
import { AppConfigService } from './config/app-config.service';
import { AppLoggerService } from './logging/app-logger.service';

export function configureApp(app: INestApplication): void {
  const config = app.get(AppConfigService);

  app.useLogger(app.get(AppLoggerService));
  app.setGlobalPrefix('api');
  app.enableShutdownHooks();
  app.use(cookieParser());
  app.enableCors({
    // Only the explicit FRONTEND_APP_URL allowlist is trusted. The previous
    // wildcard that accepted any *.vercel.app deployment (with credentials)
    // was removed: it let any Vercel account's origin send the session cookie.
    origin: (
      requestOrigin: string | undefined,
      callback: (error: Error | null, allow?: boolean | string) => void,
    ) => {
      if (config.isAllowedFrontendOrigin(requestOrigin)) {
        callback(null, requestOrigin ?? true);
        return;
      }

      callback(
        new Error(`CORS blocked origin: ${requestOrigin ?? 'unknown'}`),
        false,
      );
    },
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
