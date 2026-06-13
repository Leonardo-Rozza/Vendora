-- Replace the ProductCategory enum with a Category table that supports a
-- hierarchy (parentId). Existing products are backfilled from the old enum.

-- 1. Category table with self-referencing hierarchy.
CREATE TABLE "Category" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "parentId" TEXT,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Category_slug_key" ON "Category"("slug");
CREATE INDEX "Category_parentId_idx" ON "Category"("parentId");

ALTER TABLE "Category"
  ADD CONSTRAINT "Category_parentId_fkey"
  FOREIGN KEY ("parentId") REFERENCES "Category"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

-- 2. Seed the former enum values as top-level categories.
INSERT INTO "Category" ("id", "name", "slug", "sortOrder", "updatedAt") VALUES
  ('cat_electronica', 'Electrónica', 'electronica', 0, CURRENT_TIMESTAMP),
  ('cat_hogar', 'Hogar', 'hogar', 1, CURRENT_TIMESTAMP),
  ('cat_accesorios', 'Accesorios', 'accesorios', 2, CURRENT_TIMESTAMP);

-- 3. Link products to the table, backfilling from the old enum column.
ALTER TABLE "Product" ADD COLUMN "categoryId" TEXT;

UPDATE "Product" SET "categoryId" = CASE "category"
  WHEN 'ELECTRONICA' THEN 'cat_electronica'
  WHEN 'HOGAR' THEN 'cat_hogar'
  WHEN 'ACCESORIOS' THEN 'cat_accesorios'
  ELSE 'cat_accesorios'
END;

-- 4. Drop the old enum column, its index and the type.
DROP INDEX "Product_category_idx";
ALTER TABLE "Product" DROP COLUMN "category";
DROP TYPE "ProductCategory";

-- 5. New FK + index for categoryId.
CREATE INDEX "Product_categoryId_idx" ON "Product"("categoryId");
ALTER TABLE "Product"
  ADD CONSTRAINT "Product_categoryId_fkey"
  FOREIGN KEY ("categoryId") REFERENCES "Category"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
