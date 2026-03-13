import assert from 'node:assert/strict';
import test from 'node:test';
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

  assert.deepEqual(result, { id: 'order-1' });
  assert.deepEqual(receivedArgs, {
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

  assert.deepEqual(result, [{ id: 'order-1' }]);
  assert.deepEqual(receivedArgs, {
    where: { status: 'PENDING_PAYMENT' },
    include: {
      items: true,
      payments: true,
      user: true,
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

  assert.deepEqual(result, { id: 'order-1', status: 'PENDING_PAYMENT' });
  assert.deepEqual(calls.reserveItems, [
    { variantId: 'variant-1', quantity: 3 },
  ]);
  assert.deepEqual(calls.variantFindMany, {
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
  assert.equal(
    (calls.orderCreate as { data: { status: string } }).data.status,
    'PENDING_PAYMENT',
  );
  assert.equal(
    (calls.orderCreate as { data: { contactEmail: string } }).data.contactEmail,
    'ada@example.com',
  );
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

  await assert.rejects(
    () =>
      missingVariantService.createOrder({
        items: [{ variantId: 'variant-1', quantity: 1 }],
        ...validCheckoutInput,
      }),
    (error: unknown) => error instanceof NotFoundException,
  );

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

  await assert.rejects(
    () =>
      inactiveVariantService.createOrder({
        items: [{ variantId: 'variant-1', quantity: 1 }],
        ...validCheckoutInput,
      }),
    (error: unknown) => error instanceof ConflictException,
  );
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

  await assert.rejects(
    () =>
      service.createOrder({
        items: [
          { variantId: 'variant-1', quantity: 1 },
          { variantId: 'variant-2', quantity: 1 },
        ],
        ...validCheckoutInput,
      }),
    (error: unknown) => error instanceof BadRequestException,
  );
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

  await assert.rejects(
    () =>
      service.createOrder({
        items: [{ variantId: 'variant-1', quantity: 2 }],
        ...validCheckoutInput,
      }),
    (error: unknown) => error instanceof ConflictException,
  );
  assert.equal(calls.orderCreate, undefined);
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

  await assert.rejects(
    () =>
      service.createOrder({
        items: [{ variantId: 'variant-1', quantity: 1 }],
        ...validCheckoutInput,
        shippingAddress: {
          ...validCheckoutInput.shippingAddress,
          locality: 'Rosario',
          province: 'Santa Fe',
        },
      }),
    (error: unknown) => error instanceof BadRequestException,
  );
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

  assert.deepEqual(result, { id: 'order-1', status: 'CANCELLED' });
  assert.equal(calls.releasedOrderId, 'order-1');
  assert.deepEqual(calls.orderUpdate, {
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

  await assert.rejects(
    () => service.cancelOrder('order-1'),
    (error: unknown) => error instanceof ConflictException,
  );
});
