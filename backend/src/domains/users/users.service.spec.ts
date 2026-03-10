import assert from 'node:assert/strict';
import test from 'node:test';
import { UsersService } from './users.service';

test('UsersService loads a user by email with related orders', async () => {
  let receivedArgs: unknown;
  const service = new UsersService({
    user: {
      findUnique: async (args: unknown) => {
        receivedArgs = args;
        return { id: 'user-1' };
      },
    },
  } as never);

  const result = await service.findByEmail('buyer@example.com');

  assert.deepEqual(result, { id: 'user-1' });
  assert.deepEqual(receivedArgs, {
    where: { email: 'buyer@example.com' },
    include: {
      orders: true,
    },
  });
});
