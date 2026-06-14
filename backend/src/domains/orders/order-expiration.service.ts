import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { AppConfigService } from '../../platform/config/app-config.service';
import { AppLoggerService } from '../../platform/logging/app-logger.service';
import { OrdersService } from './orders.service';

/**
 * Releases stock held by abandoned checkouts. On a fixed interval it asks
 * {@link OrdersService.expirePendingOrders} to cancel PENDING_PAYMENT orders
 * older than `ORDER_PENDING_TTL_MINUTES` that were never paid, freeing their
 * reservation. The heavy lifting (selection + concurrency-safe cancellation)
 * lives in OrdersService so it stays unit-testable without the scheduler.
 */
@Injectable()
export class OrderExpirationService {
  /** Guards against overlapping runs if a sweep takes longer than the interval. */
  private isRunning = false;

  constructor(
    private readonly ordersService: OrdersService,
    private readonly config: AppConfigService,
    private readonly logger: AppLoggerService,
  ) {}

  @Cron(CronExpression.EVERY_5_MINUTES, { name: 'expire-pending-orders' })
  async handleCron(): Promise<void> {
    await this.expireOrders();
  }

  async expireOrders(): Promise<number> {
    if (this.isRunning) {
      return 0;
    }

    this.isRunning = true;
    const ttlMinutes = this.config.orderPendingTtlMinutes;

    try {
      const expiredCount =
        await this.ordersService.expirePendingOrders(ttlMinutes);

      if (expiredCount > 0) {
        this.logger.logOrderEvent('order.expiration.swept', {
          expiredCount,
          ttlMinutes,
        });
      }

      return expiredCount;
    } catch (error) {
      this.logger.logApplicationError(
        'order.expiration.sweep_failed',
        error instanceof Error ? error : new Error(String(error)),
        { ttlMinutes },
      );

      return 0;
    } finally {
      this.isRunning = false;
    }
  }
}
