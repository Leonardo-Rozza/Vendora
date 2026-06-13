import { z } from "zod";

import {
  CATALOG_SORT_OPTIONS,
  type CatalogCollectionResponse,
  type CatalogProductDetail,
  type CartAvailabilityLine,
  type CategoryNode,
  type CouponEvaluation,
} from "../contracts";

const catalogSortOptionSchema = z.enum(CATALOG_SORT_OPTIONS);

const categoryRefSchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
});

const categoryFacetSchema = categoryRefSchema.extend({
  parentId: z.string().nullable(),
  count: z.number(),
});

const categoryNodeSchema: z.ZodType<CategoryNode> = z.lazy(() =>
  categoryRefSchema.extend({
    parentId: z.string().nullable(),
    sortOrder: z.number(),
    children: z.array(categoryNodeSchema),
  }),
);

export const categoryTreeSchema = z.array(categoryNodeSchema);

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

const productAttributeSchema = z.object({
  attributeId: z.string(),
  attributeName: z.string(),
  attributeSlug: z.string(),
  value: z.string(),
  valueSlug: z.string(),
});

const attributeValueFacetSchema = z.object({
  id: z.string(),
  value: z.string(),
  slug: z.string(),
  count: z.number(),
});

const attributeFacetSchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
  values: z.array(attributeValueFacetSchema),
});

const appliedAttributeFilterSchema = z.object({
  slug: z.string(),
  values: z.array(z.string()),
});

const paginationSchema = z.object({
  page: z.number(),
  pageSize: z.number(),
  total: z.number(),
  totalPages: z.number(),
});

const attributeOptionSchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
  values: z.array(
    z.object({
      id: z.string(),
      value: z.string(),
      slug: z.string(),
    }),
  ),
});

export const attributesListSchema = z.array(attributeOptionSchema);

const catalogProductDetailSchema = z.object({
  id: z.string(),
  slug: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  status: z.string(),
  category: categoryRefSchema.nullable(),
  variants: z.array(catalogVariantPreviewSchema),
  images: z.array(catalogImageReferenceSchema),
  attributes: z.array(productAttributeSchema),
});

const catalogFilterMetadataSchema = z.object({
  categories: z.array(categoryFacetSchema),
  attributes: z.array(attributeFacetSchema),
  priceRange: z.object({
    minAmount: z.string().nullable(),
    maxAmount: z.string().nullable(),
  }),
  availableSorts: z.array(catalogSortOptionSchema),
  applied: z.object({
    query: z.string().nullable(),
    category: z.string().nullable(),
    minPriceAmount: z.string().nullable(),
    maxPriceAmount: z.string().nullable(),
    sort: catalogSortOptionSchema,
    attributes: z.array(appliedAttributeFilterSchema),
  }),
});

export const catalogCollectionResponseSchema = z.object({
  items: z.array(catalogProductDetailSchema),
  filters: catalogFilterMetadataSchema,
  pagination: paginationSchema,
});

export const catalogProductDetailResponseSchema = catalogProductDetailSchema;

export const relatedProductsSchema = z.array(catalogProductDetailSchema);

export const couponEvaluationSchema: z.ZodType<CouponEvaluation> =
  z.discriminatedUnion("valid", [
    z.object({
      valid: z.literal(true),
      code: z.string(),
      type: z.enum(["PERCENTAGE", "FIXED"]),
      discountAmount: z.string(),
    }),
    z.object({
      valid: z.literal(false),
      reason: z.string(),
    }),
  ]);

const cartAvailabilityLineSchema = z.object({
  variantId: z.string(),
  requestedQuantity: z.number(),
  availableQuantity: z.number(),
  available: z.boolean(),
});

export const cartAvailabilitySchema = z.array(cartAvailabilityLineSchema);

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
type _AssertAvailability = z.infer<
  typeof cartAvailabilitySchema
> extends CartAvailabilityLine[]
  ? true
  : never;

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const _assertCollection: _AssertCollection = true;
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const _assertDetail: _AssertDetail = true;
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const _assertAvailability: _AssertAvailability = true;
