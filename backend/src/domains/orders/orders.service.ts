import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { OrderStatus, Prisma, ProductStatus } from '@prisma/client';
import { InventoryService } from '../inventory/inventory.service';
import { PrismaService } from '../../platform/prisma/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';

@Injectable()
export class OrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly inventoryService: InventoryService,
  ) {}

  findOrderById(id: string) {
    return this.prisma.order.findUnique({
      where: { id },
      include: {
        items: true,
        payments: true,
        user: true,
      },
    });
  }

  listOrders(status?: OrderStatus) {
    return this.prisma.order.findMany({
      where: status ? { status } : undefined,
      include: {
        items: true,
        payments: true,
        user: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async createOrder(input: CreateOrderDto) {
    const aggregatedItems = this.aggregateItems(input.items);
    const variantIds = aggregatedItems.map((item) => item.variantId);
    const variants = await this.prisma.productVariant.findMany({
      where: {
        id: {
          in: variantIds,
        },
      },
      include: {
        product: true,
        inventoryItem: true,
      },
    });

    if (variants.length !== variantIds.length) {
      throw new NotFoundException('One or more variants were not found');
    }

    const variantMap = new Map(variants.map((variant) => [variant.id, variant]));

    for (const item of aggregatedItems) {
      const variant = variantMap.get(item.variantId);

      if (!variant) {
        throw new NotFoundException(`Variant ${item.variantId} was not found`);
      }

      if (variant.product.status !== ProductStatus.ACTIVE) {
        throw new ConflictException(
          `Variant ${item.variantId} is not available for purchase`,
        );
      }

      if (!variant.inventoryItem) {
        throw new ConflictException(
          `Variant ${item.variantId} does not have inventory configured`,
        );
      }
    }

    const currencyCodes = new Set(
      aggregatedItems.map((item) => variantMap.get(item.variantId)!.currencyCode),
    );

    if (currencyCodes.size !== 1) {
      throw new BadRequestException('Cart items must use the same currency');
    }

    const currencyCode = [...currencyCodes][0];
    const subtotalAmount = aggregatedItems.reduce((total, item) => {
      const variant = variantMap.get(item.variantId)!;
      return total.plus(variant.priceAmount.mul(item.quantity));
    }, new Prisma.Decimal(0));

    return this.prisma.$transaction(async (client) => {
      await this.inventoryService.reserveItems(client, aggregatedItems);

      return client.order.create({
        data: {
          userId: input.userId,
          status: OrderStatus.PENDING_PAYMENT,
          currencyCode,
          subtotalAmount,
          totalAmount: subtotalAmount,
          items: {
            create: aggregatedItems.map((item) => {
              const variant = variantMap.get(item.variantId)!;

              return {
                variantId: item.variantId,
                productName: variant.product.name,
                variantName: variant.name,
                sku: variant.sku,
                unitPriceAmount: variant.priceAmount,
                quantity: item.quantity,
              };
            }),
          },
        },
        include: {
          items: true,
          payments: true,
          user: true,
        },
      });
    });
  }

  async cancelOrder(orderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: true,
        payments: true,
        user: true,
      },
    });

    if (!order) {
      throw new NotFoundException(`Order ${orderId} was not found`);
    }

    if (order.status === OrderStatus.PAID || order.isLocked) {
      throw new ConflictException(`Order ${orderId} can no longer be changed`);
    }

    if (order.status === OrderStatus.CANCELLED) {
      return order;
    }

    return this.prisma.$transaction(async (client) => {
      await this.inventoryService.releaseReservationForOrder(client, orderId);

      return client.order.update({
        where: { id: orderId },
        data: {
          status: OrderStatus.CANCELLED,
        },
        include: {
          items: true,
          payments: true,
          user: true,
        },
      });
    });
  }

  private aggregateItems(items: CreateOrderDto['items']) {
    const itemsByVariantId = new Map<string, number>();

    for (const item of items) {
      itemsByVariantId.set(
        item.variantId,
        (itemsByVariantId.get(item.variantId) ?? 0) + item.quantity,
      );
    }

    return [...itemsByVariantId.entries()].map(([variantId, quantity]) => ({
      variantId,
      quantity,
    }));
  }
}
