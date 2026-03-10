import { Module } from '@nestjs/common';
import { DomainsModule } from './domains/domains.module';
import { PlatformModule } from './platform/platform.module';

@Module({
  imports: [PlatformModule, DomainsModule],
})
export class AppModule {}
