import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { AppConfigService } from '../config/app-config.service';

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

  get product() {
    return this.client.product;
  }

  get inventoryItem() {
    return this.client.inventoryItem;
  }

  get order() {
    return this.client.order;
  }

  get payment() {
    return this.client.payment;
  }

  get paymentWebhookDelivery() {
    return this.client.paymentWebhookDelivery;
  }

  get user() {
    return this.client.user;
  }
}
