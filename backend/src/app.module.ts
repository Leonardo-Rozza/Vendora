import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { DomainsModule } from './domains/domains.module';
import { PlatformModule } from './platform/platform.module';

@Module({
  imports: [
    // Global rate limiting (per IP). Sensitive endpoints tighten this with
    // @Throttle. Disabled under tests so the suite isn't throttled.
    ThrottlerModule.forRoot({
      throttlers: [{ ttl: 60_000, limit: 120 }],
      skipIf: () => process.env.NODE_ENV === 'test',
    }),
    PlatformModule,
    DomainsModule,
  ],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
