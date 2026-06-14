import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { CouponsModule } from '../coupons/coupons.module';
import { InventoryModule } from '../inventory/inventory.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { OrderExpirationService } from './order-expiration.service';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';

// The abandoned-checkout sweeper must not fire during the test suite (it would
// race the DB and make specs non-deterministic). The selection/cancellation
// logic itself stays fully testable via OrdersService.expirePendingOrders.
const schedulingEnabled = process.env.NODE_ENV !== 'test';

@Module({
  imports: [
    CouponsModule,
    InventoryModule,
    NotificationsModule,
    ...(schedulingEnabled ? [ScheduleModule.forRoot()] : []),
  ],
  controllers: [OrdersController],
  providers: [
    OrdersService,
    ...(schedulingEnabled ? [OrderExpirationService] : []),
  ],
  exports: [OrdersService],
})
export class OrdersModule {}
