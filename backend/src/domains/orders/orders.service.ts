import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  FulfillmentStatus as PrismaFulfillmentStatus,
  OrderMilestoneType,
  OrderStatus as PrismaOrderStatus,
  Prisma,
  ProductStatus,
} from '@prisma/client';
import { Optional } from '@nestjs/common';
import { InventoryService } from '../inventory/inventory.service';
import { NotificationsService } from '../notifications/notifications.service';
import { PrismaService } from '../../platform/prisma/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { isWithinAmbaShippingScope } from './amba-shipping';
import { UpdateOrderFulfillmentDto } from './dto/update-order-fulfillment.dto';
import {
  getNextFulfillmentStatus,
  isValidNextFulfillmentStatus,
} from './fulfillment-status';
import {
  buildTrackingUrlPath,
  createMilestoneContent,
  mapOrderToAdminTrackingMetadata,
  mapOrderToTrackingResponse,
  shouldSendNotificationForMilestone,
} from './order-tracking.mapper';
import { createOrderTrackingToken } from './tracking-token';

const ORDER_INCLUDE = {
  items: true,
  payments: true,
  user: true,
} as const;

const ADMIN_ORDER_INCLUDE = {
  ...ORDER_INCLUDE,
  milestones: {
    orderBy: {
      occurredAt: 'asc',
    },
  },
} as const;

const TRACKING_ORDER_INCLUDE = {
  items: true,
  payments: true,
  milestones: {
    orderBy: {
      occurredAt: 'asc',
    },
  },
} as const;

@Injectable()
export class OrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly inventoryService: InventoryService,
    @Optional()
    private readonly notificationsService?: NotificationsService,
  ) {}

  findOrderById(id: string) {
    return this.prisma.order.findUnique({
      where: { id },
      include: ORDER_INCLUDE,
    });
  }

  listOrders(
    status?: PrismaOrderStatus,
    fulfillmentStatus?: PrismaFulfillmentStatus,
  ) {
    return this.prisma.order
      .findMany({
        where:
          status || fulfillmentStatus
            ? {
                ...(status ? { status } : {}),
                ...(fulfillmentStatus ? { fulfillmentStatus } : {}),
              }
            : undefined,
        include: ADMIN_ORDER_INCLUDE,
        orderBy: {
          createdAt: 'desc',
        },
      })
      .then((orders) =>
        orders.map((order) => ({
          ...order,
          ...mapOrderToAdminTrackingMetadata(order),
        })),
      );
  }

  async findAdminOrderById(id: string) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: ADMIN_ORDER_INCLUDE,
    });

    if (!order) {
      return null;
    }

    return {
      ...order,
      ...mapOrderToAdminTrackingMetadata(order),
    };
  }

  async findOrderTrackingByToken(trackingToken: string) {
    const order = await this.prisma.order.findUnique({
      where: { trackingToken },
      include: TRACKING_ORDER_INCLUDE,
    });

    if (!order) {
      return null;
    }

    return mapOrderToTrackingResponse(order);
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

    const variantMap = new Map(
      variants.map((variant) => [variant.id, variant]),
    );

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
      aggregatedItems.map(
        (item) => variantMap.get(item.variantId)!.currencyCode,
      ),
    );

    if (currencyCodes.size !== 1) {
      throw new BadRequestException('Cart items must use the same currency');
    }

    const currencyCode = [...currencyCodes][0];
    const subtotalAmount = aggregatedItems.reduce((total, item) => {
      const variant = variantMap.get(item.variantId)!;
      return total.plus(variant.priceAmount.mul(item.quantity));
    }, new Prisma.Decimal(0));

    if (!isWithinAmbaShippingScope(input.shippingAddress)) {
      throw new BadRequestException(
        'Shipping is currently limited to AMBA destinations',
      );
    }

    const tracking = createOrderTrackingToken();

    return this.prisma.$transaction(async (client) => {
      await this.inventoryService.reserveItems(client, aggregatedItems);

      const createdOrder = await client.order.create({
        data: {
          userId: input.userId,
          status: PrismaOrderStatus.PENDING_PAYMENT,
          fulfillmentStatus: PrismaFulfillmentStatus.REQUESTED,
          trackingToken: tracking.token,
          trackingTokenHash: tracking.tokenHash,
          trackingCode: tracking.trackingCode,
          currencyCode,
          subtotalAmount,
          totalAmount: subtotalAmount,
          contactFullName: input.contact.fullName,
          contactEmail: input.contact.email,
          contactPhone: input.contact.phone,
          shippingRecipientName: input.shippingAddress.recipientName,
          shippingPhone: input.shippingAddress.phone,
          shippingStreetLine1: input.shippingAddress.streetLine1,
          shippingStreetLine2: input.shippingAddress.streetLine2,
          shippingLocality: input.shippingAddress.locality,
          shippingProvince: input.shippingAddress.province,
          shippingPostalCode: input.shippingAddress.postalCode,
          shippingDeliveryNotes: input.shippingAddress.deliveryNotes,
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
        include: ORDER_INCLUDE,
      });

      await this.createMilestone(client, {
        orderId: createdOrder.id,
        type: OrderMilestoneType.ORDER_CREATED,
      });
      await this.createMilestone(client, {
        orderId: createdOrder.id,
        type: OrderMilestoneType.PAYMENT_PENDING,
      });

      return {
        ...createdOrder,
        trackingToken: tracking.token,
        trackingCode: tracking.trackingCode,
        trackingUrlPath: buildTrackingUrlPath(tracking.token),
      };
    });
  }

  async cancelOrder(orderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: ORDER_INCLUDE,
    });

    if (!order) {
      throw new NotFoundException(`Order ${orderId} was not found`);
    }

    if (order.status === PrismaOrderStatus.PAID || order.isLocked) {
      throw new ConflictException(`Order ${orderId} can no longer be changed`);
    }

    if (order.status === PrismaOrderStatus.CANCELLED) {
      return order;
    }

    return this.prisma.$transaction(async (client) => {
      await this.inventoryService.releaseReservationForOrder(client, orderId);

      const updatedOrder = await client.order.update({
        where: { id: orderId },
        data: {
          status: PrismaOrderStatus.CANCELLED,
        },
        include: ORDER_INCLUDE,
      });

      await this.createMilestone(client, {
        orderId,
        type: OrderMilestoneType.ORDER_CANCELLED,
      });

      return updatedOrder;
    });
  }

  async updateOrderFulfillment(
    orderId: string,
    input: UpdateOrderFulfillmentDto,
  ) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: ORDER_INCLUDE,
    });

    if (!order) {
      throw new NotFoundException(`Order ${orderId} was not found`);
    }

    if (order.status === PrismaOrderStatus.CANCELLED) {
      throw new ConflictException(
        `Order ${orderId} cannot advance after cancellation`,
      );
    }

    if (order.status !== PrismaOrderStatus.PAID) {
      throw new ConflictException(
        `Order ${orderId} must be paid before fulfillment can advance`,
      );
    }

    if (
      !isValidNextFulfillmentStatus(
        order.fulfillmentStatus,
        input.fulfillmentStatus,
      )
    ) {
      const nextStatus = getNextFulfillmentStatus(order.fulfillmentStatus);
      const nextStatusLabel = nextStatus ?? 'no further transition';

      throw new ConflictException(
        `Order ${orderId} can only advance from ${order.fulfillmentStatus} to ${nextStatusLabel}`,
      );
    }

    const metadataUpdate = this.buildFulfillmentMetadataUpdate(input);

    const { updatedOrder, milestone } = await this.prisma.$transaction(
      async (client) => {
        const nextOrder = await client.order.update({
          where: { id: orderId },
          data: {
            fulfillmentStatus: input.fulfillmentStatus,
            ...metadataUpdate,
          },
          include: ORDER_INCLUDE,
        });

        const createdMilestone = await this.createMilestone(client, {
          orderId,
          type: this.mapFulfillmentToMilestoneType(input.fulfillmentStatus),
          metadata: {
            deliveryReference:
              metadataUpdate.deliveryReference ?? nextOrder.deliveryReference,
          },
        });

        return {
          updatedOrder: nextOrder,
          milestone: createdMilestone,
        };
      },
    );

    await this.maybeNotifyForMilestone(updatedOrder, milestone);

    return {
      ...updatedOrder,
      ...mapOrderToAdminTrackingMetadata(updatedOrder),
    };
  }

  private async maybeNotifyForMilestone(
    order: {
      id: string;
      contactEmail: string;
      contactFullName: string;
      trackingToken: string | null;
      trackingCode: string | null;
      deliveryReference: string | null;
    },
    milestone: {
      id: string;
      type: OrderMilestoneType;
    },
  ) {
    if (
      !this.notificationsService ||
      !shouldSendNotificationForMilestone(milestone.type)
    ) {
      return;
    }

    await this.notificationsService.dispatchMilestoneNotification({
      orderId: order.id,
      milestoneId: milestone.id,
      milestoneType: milestone.type,
      trackingToken: order.trackingToken,
      trackingCode: order.trackingCode,
      recipientEmail: order.contactEmail,
      recipientName: order.contactFullName,
      deliveryReference: order.deliveryReference,
    });
  }

  private mapFulfillmentToMilestoneType(status: PrismaFulfillmentStatus) {
    switch (status) {
      case PrismaFulfillmentStatus.CONFIRMED:
        return OrderMilestoneType.FULFILLMENT_CONFIRMED;
      case PrismaFulfillmentStatus.PREPARING:
        return OrderMilestoneType.FULFILLMENT_PREPARING;
      case PrismaFulfillmentStatus.READY_FOR_DELIVERY:
        return OrderMilestoneType.READY_FOR_DELIVERY;
      case PrismaFulfillmentStatus.OUT_FOR_DELIVERY:
        return OrderMilestoneType.OUT_FOR_DELIVERY;
      case PrismaFulfillmentStatus.DELIVERED:
        return OrderMilestoneType.DELIVERED;
      case PrismaFulfillmentStatus.REQUESTED:
        return OrderMilestoneType.ORDER_CREATED;
      default:
        return OrderMilestoneType.ORDER_CREATED;
    }
  }

  private createMilestone(
    client: {
      orderMilestone: {
        create(args: unknown): Promise<{
          id: string;
          type: OrderMilestoneType;
        }>;
      };
    },
    input: {
      orderId: string;
      type: OrderMilestoneType;
      metadata?: Prisma.InputJsonValue;
    },
  ) {
    const content = createMilestoneContent(input.type);

    return client.orderMilestone.create({
      data: {
        orderId: input.orderId,
        type: input.type,
        title: content.title,
        description: content.description,
        ...(input.metadata ? { metadata: input.metadata } : {}),
      },
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

  private buildFulfillmentMetadataUpdate(input: UpdateOrderFulfillmentDto) {
    const fulfillmentNotes = this.normalizeOptionalText(input.fulfillmentNotes);
    const deliveryReference = this.normalizeOptionalText(
      input.deliveryReference,
    );

    return {
      ...(fulfillmentNotes !== undefined ? { fulfillmentNotes } : {}),
      ...(deliveryReference !== undefined ? { deliveryReference } : {}),
    };
  }

  private normalizeOptionalText(value?: string) {
    if (value === undefined) {
      return undefined;
    }

    const normalizedValue = value.trim();
    return normalizedValue.length > 0 ? normalizedValue : null;
  }
}
