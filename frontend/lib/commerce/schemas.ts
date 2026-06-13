import { z } from "zod";

import {
  CATALOG_SORT_OPTIONS,
  PRODUCT_CATEGORIES,
  type CatalogCollectionResponse,
  type CatalogProductDetail,
} from "../contracts";

const productCategorySchema = z.enum(PRODUCT_CATEGORIES);
const catalogSortOptionSchema = z.enum(CATALOG_SORT_OPTIONS);

const catalogVariantPreviewSchema = z.object({
  id: z.string(),
  sku: z.string(),
  name: z.string(),
  priceAmount: z.string(),
  currencyCode: z.string(),
  availableQuantity: z.number().optional(),
});

const catalogImageReferenceSchema = z.object({
  id: z.string(),
  assetUrl: z.string(),
  assetKey: z.string(),
  altText: z.string().nullable(),
  sortOrder: z.number(),
});

const catalogProductDetailSchema = z.object({
  id: z.string(),
  slug: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  status: z.string(),
  category: productCategorySchema.nullable(),
  variants: z.array(catalogVariantPreviewSchema),
  images: z.array(catalogImageReferenceSchema),
});

const catalogFilterMetadataSchema = z.object({
  categories: z.array(
    z.object({
      value: productCategorySchema,
      count: z.number(),
    }),
  ),
  priceRange: z.object({
    minAmount: z.string().nullable(),
    maxAmount: z.string().nullable(),
  }),
  availableSorts: z.array(catalogSortOptionSchema),
  applied: z.object({
    query: z.string().nullable(),
    category: productCategorySchema.nullable(),
    minPriceAmount: z.string().nullable(),
    maxPriceAmount: z.string().nullable(),
    sort: catalogSortOptionSchema,
  }),
});

export const catalogCollectionResponseSchema = z.object({
  items: z.array(catalogProductDetailSchema),
  filters: catalogFilterMetadataSchema,
});

export const catalogProductDetailResponseSchema = catalogProductDetailSchema;

// Ensure the inferred schema types stay compatible with the public contracts.
type _AssertCollection = z.infer<
  typeof catalogCollectionResponseSchema
> extends CatalogCollectionResponse
  ? true
  : never;
type _AssertDetail = z.infer<
  typeof catalogProductDetailResponseSchema
> extends CatalogProductDetail
  ? true
  : never;

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const _assertCollection: _AssertCollection = true;
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const _assertDetail: _AssertDetail = true;
