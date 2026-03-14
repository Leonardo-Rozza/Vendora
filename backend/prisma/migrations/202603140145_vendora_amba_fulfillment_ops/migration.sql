-- CreateEnum
CREATE TYPE "FulfillmentStatus" AS ENUM (
  'REQUESTED',
  'CONFIRMED',
  'PREPARING',
  'READY_FOR_DELIVERY',
  'OUT_FOR_DELIVERY',
  'DELIVERED'
);

-- AlterTable
ALTER TABLE "Order"
ADD COLUMN "deliveryReference" TEXT,
ADD COLUMN "fulfillmentNotes" TEXT,
ADD COLUMN "fulfillmentStatus" "FulfillmentStatus" NOT NULL DEFAULT 'REQUESTED';

-- CreateIndex
CREATE INDEX "Order_fulfillmentStatus_idx" ON "Order"("fulfillmentStatus");
