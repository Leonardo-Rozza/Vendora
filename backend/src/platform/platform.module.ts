import { Module } from '@nestjs/common';
import { PlatformConfigModule } from './config/platform-config.module';
import { HealthModule } from './health/health.module';
import { AppLoggerModule } from './logging/app-logger.module';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [PlatformConfigModule, AppLoggerModule, PrismaModule, HealthModule],
  exports: [PlatformConfigModule, AppLoggerModule, PrismaModule],
})
export class PlatformModule {}
