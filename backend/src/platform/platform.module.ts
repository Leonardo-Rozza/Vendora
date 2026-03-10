import { Module } from '@nestjs/common';
import { PlatformConfigModule } from './config/platform-config.module';
import { HealthModule } from './health/health.module';
import { AppLoggerModule } from './logging/app-logger.module';

@Module({
  imports: [PlatformConfigModule, AppLoggerModule, HealthModule],
  exports: [PlatformConfigModule, AppLoggerModule],
})
export class PlatformModule {}
