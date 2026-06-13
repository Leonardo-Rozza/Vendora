-- Dynamic product attributes: Attribute -> AttributeValue, linked to products
-- through ProductAttributeValue. Enables faceted filtering (color, material, ...).

CREATE TABLE "Attribute" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Attribute_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Attribute_slug_key" ON "Attribute"("slug");

CREATE TABLE "AttributeValue" (
  "id" TEXT NOT NULL,
  "attributeId" TEXT NOT NULL,
  "value" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AttributeValue_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "AttributeValue_attributeId_slug_key" ON "AttributeValue"("attributeId", "slug");
CREATE INDEX "AttributeValue_attributeId_idx" ON "AttributeValue"("attributeId");
ALTER TABLE "AttributeValue"
  ADD CONSTRAINT "AttributeValue_attributeId_fkey"
  FOREIGN KEY ("attributeId") REFERENCES "Attribute"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "ProductAttributeValue" (
  "id" TEXT NOT NULL,
  "productId" TEXT NOT NULL,
  "attributeValueId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ProductAttributeValue_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "ProductAttributeValue_productId_attributeValueId_key" ON "ProductAttributeValue"("productId", "attributeValueId");
CREATE INDEX "ProductAttributeValue_productId_idx" ON "ProductAttributeValue"("productId");
CREATE INDEX "ProductAttributeValue_attributeValueId_idx" ON "ProductAttributeValue"("attributeValueId");
ALTER TABLE "ProductAttributeValue"
  ADD CONSTRAINT "ProductAttributeValue_productId_fkey"
  FOREIGN KEY ("productId") REFERENCES "Product"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ProductAttributeValue"
  ADD CONSTRAINT "ProductAttributeValue_attributeValueId_fkey"
  FOREIGN KEY ("attributeValueId") REFERENCES "AttributeValue"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

-- Seed a couple of example attributes so the admin can assign them and the
-- storefront filter sidebar has something to show.
INSERT INTO "Attribute" ("id", "name", "slug", "updatedAt") VALUES
  ('attr_color', 'Color', 'color', CURRENT_TIMESTAMP),
  ('attr_material', 'Material', 'material', CURRENT_TIMESTAMP);

INSERT INTO "AttributeValue" ("id", "attributeId", "value", "slug", "updatedAt") VALUES
  ('attrv_color_negro', 'attr_color', 'Negro', 'negro', CURRENT_TIMESTAMP),
  ('attrv_color_blanco', 'attr_color', 'Blanco', 'blanco', CURRENT_TIMESTAMP),
  ('attrv_color_azul', 'attr_color', 'Azul', 'azul', CURRENT_TIMESTAMP),
  ('attrv_material_vidrio', 'attr_material', 'Vidrio', 'vidrio', CURRENT_TIMESTAMP),
  ('attrv_material_metal', 'attr_material', 'Metal', 'metal', CURRENT_TIMESTAMP),
  ('attrv_material_madera', 'attr_material', 'Madera', 'madera', CURRENT_TIMESTAMP);
