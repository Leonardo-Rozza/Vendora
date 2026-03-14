import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { AppConfigService } from '../config/app-config.service';

type PrismaTransactionClient = Pick<
  PrismaClient,
  | 'product'
  | 'productVariant'
  | 'productImage'
  | 'inventoryItem'
  | 'order'
  | 'orderMilestone'
  | 'orderItem'
  | 'payment'
  | 'paymentWebhookDelivery'
  | 'notificationDelivery'
  | 'user'
>;

@Injectable()
export class PrismaService implements OnModuleInit, OnModuleDestroy {
  private readonly isDatabaseConfigured: boolean;
  private readonly client: PrismaClient;

  constructor(config: AppConfigService) {
    const databaseStatus = config.databaseStatus;

    this.client = new PrismaClient({
      datasources: databaseStatus.configured
        ? {
            db: {
              url: config.requireDatabaseUrl(),
            },
          }
        : undefined,
      log: ['warn', 'error'],
    });

    this.isDatabaseConfigured = databaseStatus.configured;
  }

  async onModuleInit(): Promise<void> {
    if (!this.isDatabaseConfigured) {
      return;
    }

    await this.client.$connect();
  }

  async onModuleDestroy(): Promise<void> {
    if (!this.isDatabaseConfigured) {
      return;
    }

    await this.client.$disconnect();
  }

  async $transaction<T>(
    callback: (client: PrismaTransactionClient) => Promise<T>,
  ): Promise<T> {
    return this.client.$transaction((transactionClient) =>
      callback(transactionClient),
    );
  }

  get product() {
    return this.client.product;
  }

  get inventoryItem() {
    return this.client.inventoryItem;
  }

  get productVariant() {
    return this.client.productVariant;
  }

  get productImage() {
    return this.client.productImage;
  }

  get order() {
    return this.client.order;
  }

  get orderItem() {
    return this.client.orderItem;
  }

  get orderMilestone() {
    return this.client.orderMilestone;
  }

  get payment() {
    return this.client.payment;
  }

  get paymentWebhookDelivery() {
    return this.client.paymentWebhookDelivery;
  }

  get notificationDelivery() {
    return this.client.notificationDelivery;
  }

  get user() {
    return this.client.user;
  }
}
