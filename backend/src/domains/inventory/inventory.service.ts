import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../platform/prisma/prisma.service';

type InventoryDbClient = {
  inventoryItem: {
    updateMany(args: unknown): Promise<{ count: number }>;
  };
  orderItem: {
    findMany(
      args: unknown,
    ): Promise<Array<{ variantId: string; quantity: number }>>;
  };
};

type InventoryReservationItem = {
  variantId: string;
  quantity: number;
};

@Injectable()
export class InventoryService {
  constructor(private readonly prisma: PrismaService) {}

  findByVariantId(variantId: string) {
    return this.prisma.inventoryItem.findUnique({
      where: { variantId },
      include: {
        variant: {
          include: {
            product: true,
          },
        },
      },
    });
  }

  async updateAvailableQuantity(variantId: string, availableQuantity: number) {
    const inventory = await this.prisma.inventoryItem.findUnique({
      where: { variantId },
    });

    if (inventory) {
      if (availableQuantity < inventory.reservedQuantity) {
        throw new BadRequestException(
          'Available quantity cannot be lower than reserved quantity',
        );
      }

      return this.prisma.inventoryItem.update({
        where: { variantId },
        data: {
          availableQuantity,
        },
        include: {
          variant: true,
        },
      });
    }

    const variant = await this.prisma.productVariant.findUnique({
      where: { id: variantId },
    });

    if (!variant) {
      throw new NotFoundException(`Variant ${variantId} was not found`);
    }

    return this.prisma.inventoryItem.create({
      data: {
        variantId,
        availableQuantity,
      },
      include: {
        variant: true,
      },
    });
  }

  async reserveItems(
    client: InventoryDbClient,
    items: InventoryReservationItem[],
  ) {
    for (const item of items) {
      const result = await client.inventoryItem.updateMany({
        where: {
          variantId: item.variantId,
          availableQuantity: {
            gte: item.quantity,
          },
        },
        data: {
          availableQuantity: {
            decrement: item.quantity,
          },
          reservedQuantity: {
            increment: item.quantity,
          },
        },
      });

      if (result.count === 0) {
        throw new ConflictException(
          `Variant ${item.variantId} does not have enough available stock`,
        );
      }
    }
  }

  async releaseReservationForOrder(client: InventoryDbClient, orderId: string) {
    const items = await this.getOrderItems(client, orderId);

    for (const item of items) {
      const result = await client.inventoryItem.updateMany({
        where: {
          variantId: item.variantId,
          reservedQuantity: {
            gte: item.quantity,
          },
        },
        data: {
          availableQuantity: {
            increment: item.quantity,
          },
          reservedQuantity: {
            decrement: item.quantity,
          },
        },
      });

      if (result.count === 0) {
        throw new ConflictException(
          `Variant ${item.variantId} does not have a matching reservation to release`,
        );
      }
    }
  }

  async consumeReservationForOrder(client: InventoryDbClient, orderId: string) {
    const items = await this.getOrderItems(client, orderId);

    for (const item of items) {
      const result = await client.inventoryItem.updateMany({
        where: {
          variantId: item.variantId,
          reservedQuantity: {
            gte: item.quantity,
          },
        },
        data: {
          reservedQuantity: {
            decrement: item.quantity,
          },
        },
      });

      if (result.count === 0) {
        throw new ConflictException(
          `Variant ${item.variantId} does not have a matching reservation to consume`,
        );
      }
    }
  }

  private getOrderItems(client: InventoryDbClient, orderId: string) {
    return client.orderItem.findMany({
      where: { orderId },
      select: {
        variantId: true,
        quantity: true,
      },
    });
  }
}
