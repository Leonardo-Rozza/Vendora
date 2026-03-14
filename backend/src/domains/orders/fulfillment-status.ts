import { FulfillmentStatus } from '@prisma/client';

export const NEXT_FULFILLMENT_STATUS: Record<
  FulfillmentStatus,
  FulfillmentStatus | null
> = {
  REQUESTED: FulfillmentStatus.CONFIRMED,
  CONFIRMED: FulfillmentStatus.PREPARING,
  PREPARING: FulfillmentStatus.READY_FOR_DELIVERY,
  READY_FOR_DELIVERY: FulfillmentStatus.OUT_FOR_DELIVERY,
  OUT_FOR_DELIVERY: FulfillmentStatus.DELIVERED,
  DELIVERED: null,
};

export function getNextFulfillmentStatus(status: FulfillmentStatus) {
  return NEXT_FULFILLMENT_STATUS[status];
}

export function isValidNextFulfillmentStatus(
  currentStatus: FulfillmentStatus,
  nextStatus: FulfillmentStatus,
) {
  return getNextFulfillmentStatus(currentStatus) === nextStatus;
}
