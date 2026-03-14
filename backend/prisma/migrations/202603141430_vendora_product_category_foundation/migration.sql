-- CreateEnum
CREATE TYPE "ProductCategory" AS ENUM (
  'ELECTRONICA',
  'HOGAR',
  'ACCESORIOS'
);

-- AlterTable
ALTER TABLE "Product"
ADD COLUMN "category" "ProductCategory" DEFAULT 'ACCESORIOS';

-- Backfill
UPDATE "Product"
SET "category" = 'ACCESORIOS'
WHERE "category" IS NULL;

-- CreateIndex
CREATE INDEX "Product_category_idx" ON "Product"("category");
