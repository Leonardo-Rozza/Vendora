import { Controller, Get } from '@nestjs/common';
import { AppConfigService } from '../config/app-config.service';

@Controller('health')
export class HealthController {
  constructor(private readonly appConfigService: AppConfigService) {}

  @Get()
  getStatus() {
    return {
      status: 'ok',
      app: {
        name: this.appConfigService.appName,
        environment: this.appConfigService.environment,
      },
      services: this.appConfigService.getCapabilitySummary(),
    };
  }
}
