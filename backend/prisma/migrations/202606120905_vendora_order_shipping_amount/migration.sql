-- Prepare orders for shipping costs: total = subtotalAmount + shippingAmount.
-- Defaults to 0 (shipping currently free) so existing and new orders stay
-- consistent until a real shipping cost is charged.

ALTER TABLE "Order"
  ADD COLUMN "shippingAmount" DECIMAL(10, 2) NOT NULL DEFAULT 0;
