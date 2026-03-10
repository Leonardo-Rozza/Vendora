import assert from 'node:assert/strict';
import test from 'node:test';
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
      variant: true,
    },
  });
});
