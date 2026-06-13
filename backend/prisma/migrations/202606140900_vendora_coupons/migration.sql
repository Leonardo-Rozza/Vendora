-- Coupons / discounts. Orders snapshot the applied coupon code and discount.

CREATE TYPE "CouponType" AS ENUM ('PERCENTAGE', 'FIXED');

CREATE TABLE "Coupon" (
  "id" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "type" "CouponType" NOT NULL,
  "value" DECIMAL(10, 2) NOT NULL,
  "minSubtotalAmount" DECIMAL(10, 2),
  "maxRedemptions" INTEGER,
  "timesRedeemed" INTEGER NOT NULL DEFAULT 0,
  "startsAt" TIMESTAMP(3),
  "endsAt" TIMESTAMP(3),
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Coupon_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Coupon_code_key" ON "Coupon"("code");

ALTER TABLE "Order"
  ADD COLUMN "discountAmount" DECIMAL(10, 2) NOT NULL DEFAULT 0,
  ADD COLUMN "couponCode" TEXT;

-- A welcome coupon to demonstrate the flow.
INSERT INTO "Coupon" ("id", "code", "type", "value", "minSubtotalAmount", "updatedAt")
VALUES ('coupon_bienvenida10', 'BIENVENIDA10', 'PERCENTAGE', 10, 0, CURRENT_TIMESTAMP);
