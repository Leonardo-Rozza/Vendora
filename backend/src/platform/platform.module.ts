import { Module } from '@nestjs/common';
import { PlatformConfigModule } from './config/platform-config.module';
import { HealthModule } from './health/health.module';
import { AppLoggerModule } from './logging/app-logger.module';
import { MediaModule } from './media/media.module';
import { PrismaModule } from './prisma/prisma.module';
import { ProvidersModule } from './providers/providers.module';

@Module({
  imports: [
    PlatformConfigModule,
    AppLoggerModule,
    ProvidersModule,
    PrismaModule,
    HealthModule,
    MediaModule,
  ],
  exports: [PlatformConfigModule, AppLoggerModule, ProvidersModule, PrismaModule],
})
export class PlatformModule {}
