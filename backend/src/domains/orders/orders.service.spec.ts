import assert from 'node:assert/strict';
import test from 'node:test';
import { OrdersService } from './orders.service';

test('OrdersService loads an order with item and payment snapshots', async () => {
  let receivedArgs: unknown;
  const service = new OrdersService({
    order: {
      findUnique: async (args: unknown) => {
        receivedArgs = args;
        return { id: 'order-1' };
      },
    },
  } as never);

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
