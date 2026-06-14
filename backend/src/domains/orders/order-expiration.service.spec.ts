import { OrderExpirationService } from './order-expiration.service';

function build(overrides: {
  expirePendingOrders?: (ttl: number) => Promise<number>;
  ttlMinutes?: number;
  logger?: unknown;
}) {
  const orders = {
    expirePendingOrders: overrides.expirePendingOrders ?? (async () => 0),
  };
  const config = { orderPendingTtlMinutes: overrides.ttlMinutes ?? 60 };
  const logger = overrides.logger ?? {
    logOrderEvent: () => undefined,
    logApplicationError: () => undefined,
  };

  return new OrderExpirationService(
    orders as never,
    config as never,
    logger as never,
  );
}

test('OrderExpirationService passes the configured TTL to the orders sweep', async () => {
  let receivedTtl: number | undefined;
  const service = build({
    ttlMinutes: 30,
    expirePendingOrders: async (ttl: number) => {
      receivedTtl = ttl;
      return 3;
    },
  });

  const count = await service.expireOrders();

  expect(count).toBe(3);
  expect(receivedTtl).toBe(30);
});

test('OrderExpirationService logs a summary only when orders were expired', async () => {
  const events: Array<{ event: string; payload: unknown }> = [];
  const logger = {
    logOrderEvent: (event: string, payload: unknown) =>
      events.push({ event, payload }),
    logApplicationError: () => undefined,
  };

  const swept = build({ expirePendingOrders: async () => 2, logger });
  await swept.expireOrders();
  expect(events).toEqual([
    {
      event: 'order.expiration.swept',
      payload: { expiredCount: 2, ttlMinutes: 60 },
    },
  ]);

  events.length = 0;
  const empty = build({ expirePendingOrders: async () => 0, logger });
  await empty.expireOrders();
  expect(events).toEqual([]);
});

test('OrderExpirationService swallows sweep errors and logs them', async () => {
  const errors: string[] = [];
  const service = build({
    expirePendingOrders: async () => {
      throw new Error('db down');
    },
    logger: {
      logOrderEvent: () => undefined,
      logApplicationError: (event: string) => errors.push(event),
    },
  });

  const count = await service.expireOrders();

  expect(count).toBe(0);
  expect(errors).toEqual(['order.expiration.sweep_failed']);
});

test('OrderExpirationService does not run overlapping sweeps', async () => {
  let active = 0;
  let maxActive = 0;
  const service = build({
    expirePendingOrders: async () => {
      active += 1;
      maxActive = Math.max(maxActive, active);
      await new Promise((resolve) => setTimeout(resolve, 5));
      active -= 1;
      return 1;
    },
  });

  await Promise.all([service.expireOrders(), service.expireOrders()]);

  expect(maxActive).toBe(1);
});
