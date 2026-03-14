-- CreateEnum
CREATE TYPE "OrderMilestoneType" AS ENUM (
  'ORDER_CREATED',
  'PAYMENT_PENDING',
  'PAYMENT_CONFIRMED',
  'FULFILLMENT_CONFIRMED',
  'FULFILLMENT_PREPARING',
  'READY_FOR_DELIVERY',
  'OUT_FOR_DELIVERY',
  'DELIVERED',
  'ORDER_CANCELLED'
);

-- CreateEnum
CREATE TYPE "NotificationChannel" AS ENUM ('EMAIL');

-- CreateEnum
CREATE TYPE "NotificationDeliveryStatus" AS ENUM (
  'PENDING',
  'SENT',
  'FAILED',
  'SKIPPED'
);

-- AlterTable
ALTER TABLE "Order"
ADD COLUMN "trackingToken" TEXT,
ADD COLUMN "trackingTokenHash" TEXT,
ADD COLUMN "trackingCode" TEXT;

-- CreateTable
CREATE TABLE "OrderMilestone" (
  "id" TEXT NOT NULL,
  "orderId" TEXT NOT NULL,
  "type" "OrderMilestoneType" NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "metadata" JSONB,
  "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "OrderMilestone_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NotificationDelivery" (
  "id" TEXT NOT NULL,
  "orderId" TEXT NOT NULL,
  "milestoneId" TEXT,
  "channel" "NotificationChannel" NOT NULL,
  "recipient" TEXT NOT NULL,
  "provider" TEXT,
  "providerMessageId" TEXT,
  "status" "NotificationDeliveryStatus" NOT NULL DEFAULT 'PENDING',
  "payload" JSONB,
  "errorMessage" TEXT,
  "sentAt" TIMESTAMP(3),
  "failedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "NotificationDelivery_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Order_trackingTokenHash_key" ON "Order"("trackingTokenHash");

-- CreateIndex
CREATE UNIQUE INDEX "Order_trackingCode_key" ON "Order"("trackingCode");

-- CreateIndex
CREATE UNIQUE INDEX "Order_trackingToken_key" ON "Order"("trackingToken");

-- CreateIndex
CREATE INDEX "OrderMilestone_orderId_occurredAt_idx" ON "OrderMilestone"("orderId", "occurredAt");

-- CreateIndex
CREATE INDEX "OrderMilestone_type_idx" ON "OrderMilestone"("type");

-- CreateIndex
CREATE INDEX "NotificationDelivery_orderId_idx" ON "NotificationDelivery"("orderId");

-- CreateIndex
CREATE INDEX "NotificationDelivery_milestoneId_idx" ON "NotificationDelivery"("milestoneId");

-- CreateIndex
CREATE INDEX "NotificationDelivery_status_idx" ON "NotificationDelivery"("status");

-- AddForeignKey
ALTER TABLE "OrderMilestone"
ADD CONSTRAINT "OrderMilestone_orderId_fkey"
FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotificationDelivery"
ADD CONSTRAINT "NotificationDelivery_orderId_fkey"
FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotificationDelivery"
ADD CONSTRAINT "NotificationDelivery_milestoneId_fkey"
FOREIGN KEY ("milestoneId") REFERENCES "OrderMilestone"("id") ON DELETE SET NULL ON UPDATE CASCADE;
