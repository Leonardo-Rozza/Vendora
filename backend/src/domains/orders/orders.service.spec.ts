import { Prisma } from '@prisma/client';
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { OrdersService } from './orders.service';

const validCheckoutInput = {
  contact: {
    fullName: 'Ada Buyer',
    email: 'ada@example.com',
    phone: '11 5555 1111',
  },
  shippingAddress: {
    recipientName: 'Ada Buyer',
    phone: '11 5555 1111',
    streetLine1: 'Cabildo 123',
    locality: 'CABA',
    province: 'CABA',
    postalCode: 'C1426',
  },
};

const noopInventoryService = {
  reserveItems: async () => undefined,
  releaseReservationForOrder: async () => undefined,
} as never;

test('OrdersService loads an order with item and payment snapshots', async () => {
  let receivedArgs: unknown;
  const service = new OrdersService(
    {
      order: {
        findUnique: async (args: unknown) => {
          receivedArgs = args;
          return { id: 'order-1' };
        },
      },
    } as never,
    noopInventoryService,
  );

  const result = await service.findOrderById('order-1');

  expect(result).toEqual({ id: 'order-1' });
  expect(receivedArgs).toEqual({
    where: { id: 'order-1' },
    include: {
      items: true,
      payments: true,
      user: true,
    },
  });
});

test('OrdersService lists orders with an optional status filter', async () => {
  let receivedArgs: unknown;
  const service = new OrdersService(
    {
      order: {
        findMany: async (args: unknown) => {
          receivedArgs = args;
          return [{ id: 'order-1' }];
        },
      },
    } as never,
    noopInventoryService,
  );

  const result = await service.listOrders('PENDING_PAYMENT');

  expect(result).toEqual([expect.objectContaining({ id: 'order-1' })]);
  expect(receivedArgs).toEqual({
    where: { status: 'PENDING_PAYMENT' },
    include: {
      items: true,
      payments: true,
      user: true,
      milestones: {
        orderBy: {
          occurredAt: 'asc',
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });
});

test('OrdersService lists orders with combined commercial and fulfillment filters', async () => {
  let receivedArgs: unknown;
  const service = new OrdersService(
    {
      order: {
        findMany: async (args: unknown) => {
          receivedArgs = args;
          return [{ id: 'order-1' }];
        },
      },
    } as never,
    noopInventoryService,
  );

  const result = await service.listOrders('PAID', 'READY_FOR_DELIVERY');

  expect(result).toEqual([expect.objectContaining({ id: 'order-1' })]);
  expect(receivedArgs).toEqual({
    where: {
      status: 'PAID',
      fulfillmentStatus: 'READY_FOR_DELIVERY',
    },
    include: {
      items: true,
      payments: true,
      user: true,
      milestones: {
        orderBy: {
          occurredAt: 'asc',
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });
});

test('OrdersService creates a pending-payment order from valid cart items', async () => {
  const calls: Record<string, unknown> = {};
  const service = new OrdersService(
    {
      productVariant: {
        findMany: async (args: unknown) => {
          calls.variantFindMany = args;
          return [
            {
              id: 'variant-1',
              sku: 'SKU-1',
              name: 'Standard',
              priceAmount: new Prisma.Decimal('12500.00'),
              currencyCode: 'ARS',
              product: {
                name: 'Mate Gourd',
                status: 'ACTIVE',
              },
              inventoryItem: {
                availableQuantity: 5,
              },
            },
          ];
        },
      },
      $transaction: async (callback: (client: any) => Promise<unknown>) =>
        callback({
          order: {
            create: async (args: unknown) => {
              calls.orderCreate = args;
              return { id: 'order-1', status: 'PENDING_PAYMENT' };
            },
          },
          orderMilestone: {
            create: async () => ({
              id: 'milestone-1',
              type: 'ORDER_CREATED',
            }),
          },
        }),
    } as never,
    {
      reserveItems: async (_client: unknown, items: unknown) => {
        calls.reserveItems = items;
      },
      releaseReservationForOrder: async () => undefined,
    } as never,
  );

  const result = await service.createOrder({
    items: [
      { variantId: 'variant-1', quantity: 1 },
      { variantId: 'variant-1', quantity: 2 },
    ],
    ...validCheckoutInput,
  });

  expect(result).toMatchObject({ id: 'order-1', status: 'PENDING_PAYMENT' });
  expect(calls.reserveItems).toEqual([
    { variantId: 'variant-1', quantity: 3 },
  ]);
  expect(calls.variantFindMany).toEqual({
    where: {
      id: {
        in: ['variant-1'],
      },
    },
    include: {
      product: true,
      inventoryItem: true,
    },
  });
  expect(
    (calls.orderCreate as { data: { status: string } }).data.status,
  ).toBe('PENDING_PAYMENT');
  expect(
    (calls.orderCreate as { data: { fulfillmentStatus: string } }).data
      .fulfillmentStatus,
  ).toBe('REQUESTED');
  expect(
    (calls.orderCreate as { data: { contactEmail: string } }).data.contactEmail,
  ).toBe('ada@example.com');
});

test('OrdersService rejects unknown or inactive variants', async () => {
  const missingVariantService = new OrdersService(
    {
      productVariant: {
        findMany: async () => [],
      },
    } as never,
    noopInventoryService,
  );

  await expect(
    missingVariantService.createOrder({
      items: [{ variantId: 'variant-1', quantity: 1 }],
      ...validCheckoutInput,
    }),
  ).rejects.toBeInstanceOf(NotFoundException);

  const inactiveVariantService = new OrdersService(
    {
      productVariant: {
        findMany: async () => [
          {
            id: 'variant-1',
            sku: 'SKU-1',
            name: 'Standard',
            priceAmount: new Prisma.Decimal('12500.00'),
            currencyCode: 'ARS',
            product: {
              name: 'Mate Gourd',
              status: 'DRAFT',
            },
            inventoryItem: {
              availableQuantity: 5,
            },
          },
        ],
      },
    } as never,
    noopInventoryService,
  );

  await expect(
    inactiveVariantService.createOrder({
      items: [{ variantId: 'variant-1', quantity: 1 }],
      ...validCheckoutInput,
    }),
  ).rejects.toBeInstanceOf(ConflictException);
});

test('OrdersService rejects mixed-currency carts', async () => {
  const service = new OrdersService(
    {
      productVariant: {
        findMany: async () => [
          {
            id: 'variant-1',
            sku: 'SKU-1',
            name: 'Standard',
            priceAmount: new Prisma.Decimal('12500.00'),
            currencyCode: 'ARS',
            product: { name: 'Mate', status: 'ACTIVE' },
            inventoryItem: { availableQuantity: 5 },
          },
          {
            id: 'variant-2',
            sku: 'SKU-2',
            name: 'XL',
            priceAmount: new Prisma.Decimal('10.00'),
            currencyCode: 'USD',
            product: { name: 'Mate', status: 'ACTIVE' },
            inventoryItem: { availableQuantity: 5 },
          },
        ],
      },
    } as never,
    noopInventoryService,
  );

  await expect(
    service.createOrder({
      items: [
        { variantId: 'variant-1', quantity: 1 },
        { variantId: 'variant-2', quantity: 1 },
      ],
      ...validCheckoutInput,
    }),
  ).rejects.toBeInstanceOf(BadRequestException);
});

test('OrdersService propagates insufficient stock failures without creating an order', async () => {
  const calls: Record<string, unknown> = {};
  const service = new OrdersService(
    {
      productVariant: {
        findMany: async () => [
          {
            id: 'variant-1',
            sku: 'SKU-1',
            name: 'Standard',
            priceAmount: new Prisma.Decimal('12500.00'),
            currencyCode: 'ARS',
            product: { name: 'Mate', status: 'ACTIVE' },
            inventoryItem: { availableQuantity: 1 },
          },
        ],
      },
      $transaction: async (callback: (client: any) => Promise<unknown>) =>
        callback({
          order: {
            create: async (args: unknown) => {
              calls.orderCreate = args;
              return args;
            },
          },
        }),
    } as never,
    {
      reserveItems: async () => {
        throw new ConflictException('out of stock');
      },
      releaseReservationForOrder: async () => undefined,
    } as never,
  );

  await expect(
    service.createOrder({
      items: [{ variantId: 'variant-1', quantity: 2 }],
      ...validCheckoutInput,
    }),
  ).rejects.toBeInstanceOf(ConflictException);
  expect(calls.orderCreate).toBeUndefined();
});

test('OrdersService rejects shipping destinations outside AMBA', async () => {
  const service = new OrdersService(
    {
      productVariant: {
        findMany: async () => [
          {
            id: 'variant-1',
            sku: 'SKU-1',
            name: 'Standard',
            priceAmount: new Prisma.Decimal('12500.00'),
            currencyCode: 'ARS',
            product: { name: 'Mate', status: 'ACTIVE' },
            inventoryItem: { availableQuantity: 5 },
          },
        ],
      },
    } as never,
    noopInventoryService,
  );

  await expect(
    service.createOrder({
      items: [{ variantId: 'variant-1', quantity: 1 }],
      ...validCheckoutInput,
      shippingAddress: {
        ...validCheckoutInput.shippingAddress,
        locality: 'Rosario',
        province: 'Santa Fe',
      },
    }),
  ).rejects.toBeInstanceOf(BadRequestException);
});

test('OrdersService cancels unpaid orders and releases reservations', async () => {
  const calls: Record<string, unknown> = {};
  const service = new OrdersService(
    {
      order: {
        findUnique: async () => ({
          id: 'order-1',
          status: 'PENDING_PAYMENT',
          isLocked: false,
          items: [],
          payments: [],
          user: null,
        }),
        update: async () => ({ id: 'order-1', status: 'CANCELLED' }),
      },
      $transaction: async (callback: (client: any) => Promise<unknown>) =>
        callback({
          order: {
            update: async (args: unknown) => {
              calls.orderUpdate = args;
              return { id: 'order-1', status: 'CANCELLED' };
            },
          },
          orderMilestone: {
            create: async () => ({
              id: 'milestone-1',
              type: 'ORDER_CANCELLED',
            }),
          },
        }),
    } as never,
    {
      reserveItems: async () => undefined,
      releaseReservationForOrder: async (_client: unknown, orderId: string) => {
        calls.releasedOrderId = orderId;
      },
    } as never,
  );

  const result = await service.cancelOrder('order-1');

  expect(result).toEqual({ id: 'order-1', status: 'CANCELLED' });
  expect(calls.releasedOrderId).toBe('order-1');
  expect(calls.orderUpdate).toEqual({
    where: { id: 'order-1' },
    data: {
      status: 'CANCELLED',
    },
    include: {
      items: true,
      payments: true,
      user: true,
    },
  });
});

test('OrdersService rejects cancellation for paid orders', async () => {
  const service = new OrdersService(
    {
      order: {
        findUnique: async () => ({
          id: 'order-1',
          status: 'PAID',
          isLocked: true,
          items: [],
          payments: [],
          user: null,
        }),
      },
    } as never,
    noopInventoryService,
  );

  await expect(service.cancelOrder('order-1')).rejects.toBeInstanceOf(
    ConflictException,
  );
});

test('OrdersService advances paid orders through the next fulfillment state and stores metadata', async () => {
  let receivedArgs: unknown;
  const service = new OrdersService(
    {
      order: {
        findUnique: async () => ({
          id: 'order-1',
          status: 'PAID',
          fulfillmentStatus: 'REQUESTED',
          fulfillmentNotes: 'Initial note',
          deliveryReference: null,
          isLocked: true,
          items: [],
          payments: [],
          user: null,
        }),
      },
      $transaction: async (callback: (client: any) => Promise<unknown>) =>
        callback({
          order: {
            update: async (args: unknown) => {
              receivedArgs = args;
              return { id: 'order-1', fulfillmentStatus: 'CONFIRMED' };
            },
          },
          orderMilestone: {
            create: async () => ({
              id: 'milestone-1',
              type: 'FULFILLMENT_CONFIRMED',
            }),
          },
        }),
    } as never,
    noopInventoryService,
  );

  const result = await service.updateOrderFulfillment('order-1', {
    fulfillmentStatus: 'CONFIRMED',
    fulfillmentNotes: 'Packed for tomorrow',
    deliveryReference: 'RUTA-14',
  });

  expect(result).toMatchObject({ id: 'order-1', fulfillmentStatus: 'CONFIRMED' });
  expect(receivedArgs).toEqual({
    where: { id: 'order-1' },
    data: {
      fulfillmentStatus: 'CONFIRMED',
      fulfillmentNotes: 'Packed for tomorrow',
      deliveryReference: 'RUTA-14',
    },
    include: {
      items: true,
      payments: true,
      user: true,
    },
  });
});

test('OrdersService preserves omitted fulfillment metadata during valid transitions', async () => {
  let receivedArgs: unknown;
  const service = new OrdersService(
    {
      order: {
        findUnique: async () => ({
          id: 'order-1',
          status: 'PAID',
          fulfillmentStatus: 'CONFIRMED',
          fulfillmentNotes: 'Keep existing note',
          deliveryReference: 'REF-1',
          isLocked: true,
          items: [],
          payments: [],
          user: null,
        }),
      },
      $transaction: async (callback: (client: any) => Promise<unknown>) =>
        callback({
          order: {
            update: async (args: unknown) => {
              receivedArgs = args;
              return { id: 'order-1', fulfillmentStatus: 'PREPARING' };
            },
          },
          orderMilestone: {
            create: async () => ({
              id: 'milestone-1',
              type: 'FULFILLMENT_PREPARING',
            }),
          },
        }),
    } as never,
    noopInventoryService,
  );

  await service.updateOrderFulfillment('order-1', {
    fulfillmentStatus: 'PREPARING',
  });

  expect(receivedArgs).toEqual({
    where: { id: 'order-1' },
    data: {
      fulfillmentStatus: 'PREPARING',
    },
    include: {
      items: true,
      payments: true,
      user: true,
    },
  });
});

test('OrdersService rejects skipped fulfillment transitions', async () => {
  const service = new OrdersService(
    {
      order: {
        findUnique: async () => ({
          id: 'order-1',
          status: 'PAID',
          fulfillmentStatus: 'REQUESTED',
          isLocked: true,
          items: [],
          payments: [],
          user: null,
        }),
      },
    } as never,
    noopInventoryService,
  );

  await expect(
    service.updateOrderFulfillment('order-1', {
      fulfillmentStatus: 'OUT_FOR_DELIVERY',
    }),
  ).rejects.toBeInstanceOf(ConflictException);
});

test('OrdersService rejects backward fulfillment transitions', async () => {
  const service = new OrdersService(
    {
      order: {
        findUnique: async () => ({
          id: 'order-1',
          status: 'PAID',
          fulfillmentStatus: 'READY_FOR_DELIVERY',
          isLocked: true,
          items: [],
          payments: [],
          user: null,
        }),
      },
    } as never,
    noopInventoryService,
  );

  await expect(
    service.updateOrderFulfillment('order-1', {
      fulfillmentStatus: 'PREPARING',
    }),
  ).rejects.toBeInstanceOf(ConflictException);
});

test('OrdersService rejects fulfillment transitions for unpaid or cancelled orders', async () => {
  const unpaidService = new OrdersService(
    {
      order: {
        findUnique: async () => ({
          id: 'order-1',
          status: 'PENDING_PAYMENT',
          fulfillmentStatus: 'REQUESTED',
          isLocked: false,
          items: [],
          payments: [],
          user: null,
        }),
      },
    } as never,
    noopInventoryService,
  );

  await expect(
    unpaidService.updateOrderFulfillment('order-1', {
      fulfillmentStatus: 'CONFIRMED',
    }),
  ).rejects.toBeInstanceOf(ConflictException);

  const cancelledService = new OrdersService(
    {
      order: {
        findUnique: async () => ({
          id: 'order-2',
          status: 'CANCELLED',
          fulfillmentStatus: 'REQUESTED',
          isLocked: false,
          items: [],
          payments: [],
          user: null,
        }),
      },
    } as never,
    noopInventoryService,
  );

  await expect(
    cancelledService.updateOrderFulfillment('order-2', {
      fulfillmentStatus: 'CONFIRMED',
    }),
  ).rejects.toBeInstanceOf(ConflictException);
});
