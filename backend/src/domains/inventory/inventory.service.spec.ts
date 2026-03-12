import assert from 'node:assert/strict';
import test from 'node:test';
import { BadRequestException, ConflictException } from '@nestjs/common';
import { InventoryService } from './inventory.service';

test('InventoryService loads inventory by variant id', async () => {
  let receivedArgs: unknown;
  const service = new InventoryService({
    inventoryItem: {
      findUnique: async (args: unknown) => {
        receivedArgs = args;
        return { id: 'inventory-1' };
      },
    },
  } as never);

  const result = await service.findByVariantId('variant-1');

  assert.deepEqual(result, { id: 'inventory-1' });
  assert.deepEqual(receivedArgs, {
    where: { variantId: 'variant-1' },
    include: {
      variant: {
        include: {
          product: true,
        },
      },
    },
  });
});

test('InventoryService safely updates available quantity when it does not undercut reserved stock', async () => {
  const calls: Record<string, unknown> = {};
  const service = new InventoryService({
    inventoryItem: {
      findUnique: async () => ({ variantId: 'variant-1', reservedQuantity: 2 }),
      update: async (args: unknown) => {
        calls.update = args;
        return { id: 'inventory-1' };
      },
    },
  } as never);

  const result = await service.updateAvailableQuantity('variant-1', 4);

  assert.deepEqual(result, { id: 'inventory-1' });
  assert.deepEqual(calls.update, {
    where: { variantId: 'variant-1' },
    data: {
      availableQuantity: 4,
    },
    include: {
      variant: true,
    },
  });
});

test('InventoryService rejects invalid admin adjustments below reserved stock', async () => {
  const service = new InventoryService({
    inventoryItem: {
      findUnique: async () => ({ variantId: 'variant-1', reservedQuantity: 3 }),
    },
  } as never);

  await assert.rejects(
    () => service.updateAvailableQuantity('variant-1', 2),
    (error: unknown) => error instanceof BadRequestException,
  );
});

test('InventoryService reserves stock for order creation', async () => {
  const calls: unknown[] = [];
  const service = new InventoryService({} as never);

  await service.reserveItems(
    {
      inventoryItem: {
        updateMany: async (args: unknown) => {
          calls.push(args);
          return { count: 1 };
        },
      },
    } as never,
    [{ variantId: 'variant-1', quantity: 2 }],
  );

  assert.deepEqual(calls, [
    {
      where: {
        variantId: 'variant-1',
        availableQuantity: {
          gte: 2,
        },
      },
      data: {
        availableQuantity: {
          decrement: 2,
        },
        reservedQuantity: {
          increment: 2,
        },
      },
    },
  ]);
});

test('InventoryService rejects reservation when stock is insufficient', async () => {
  const service = new InventoryService({} as never);

  await assert.rejects(
    () =>
      service.reserveItems(
        {
          inventoryItem: {
            updateMany: async () => ({ count: 0 }),
          },
        } as never,
        [{ variantId: 'variant-1', quantity: 2 }],
      ),
    (error: unknown) => error instanceof ConflictException,
  );
});

test('InventoryService releases and consumes order reservations', async () => {
  const calls: Record<string, unknown[]> = {
    release: [],
    consume: [],
  };
  const service = new InventoryService({} as never);
  const client = {
    orderItem: {
      findMany: async () => [{ variantId: 'variant-1', quantity: 2 }],
    },
    inventoryItem: {
      updateMany: async (args: unknown) => {
        if ((args as { data: { availableQuantity?: unknown } }).data.availableQuantity) {
          calls.release.push(args);
        } else {
          calls.consume.push(args);
        }

        return { count: 1 };
      },
    },
  };

  await service.releaseReservationForOrder(client as never, 'order-1');
  await service.consumeReservationForOrder(client as never, 'order-1');

  assert.deepEqual(calls.release, [
    {
      where: {
        variantId: 'variant-1',
        reservedQuantity: {
          gte: 2,
        },
      },
      data: {
        availableQuantity: {
          increment: 2,
        },
        reservedQuantity: {
          decrement: 2,
        },
      },
    },
  ]);
  assert.deepEqual(calls.consume, [
    {
      where: {
        variantId: 'variant-1',
        reservedQuantity: {
          gte: 2,
        },
      },
      data: {
        reservedQuantity: {
          decrement: 2,
        },
      },
    },
  ]);
});
