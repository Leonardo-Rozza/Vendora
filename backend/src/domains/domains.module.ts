import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { CatalogModule } from './catalog/catalog.module';
import { InventoryModule } from './inventory/inventory.module';
import { OrdersModule } from './orders/orders.module';
import { PaymentsModule } from './payments/payments.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    AuthModule,
    CatalogModule,
    InventoryModule,
    OrdersModule,
    PaymentsModule,
    UsersModule,
  ],
  exports: [
    AuthModule,
    CatalogModule,
    InventoryModule,
    OrdersModule,
    PaymentsModule,
    UsersModule,
  ],
})
export class DomainsModule {}
