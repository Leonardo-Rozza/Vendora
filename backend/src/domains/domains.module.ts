import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { CatalogModule } from './catalog/catalog.module';
import { InventoryModule } from './inventory/inventory.module';
import { NotificationsModule } from './notifications/notifications.module';
import { OrdersModule } from './orders/orders.module';
import { PaymentsModule } from './payments/payments.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    AuthModule,
    CatalogModule,
    InventoryModule,
    NotificationsModule,
    OrdersModule,
    PaymentsModule,
    UsersModule,
  ],
  exports: [
    AuthModule,
    CatalogModule,
    InventoryModule,
    NotificationsModule,
    OrdersModule,
    PaymentsModule,
    UsersModule,
  ],
})
export class DomainsModule {}
