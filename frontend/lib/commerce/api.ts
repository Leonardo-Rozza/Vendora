import type {
  AdminOrder,
  AdminProduct,
  AdminProductInput,
  AdminSession,
  AttributeOption,
  CartAvailabilityLine,
  CatalogCollectionResponse,
  CatalogFilters,
  CatalogProductCard,
  CatalogProductDetail,
  CategoryNode,
  CheckoutPreferenceResponse,
  CouponEvaluation,
  CreateCheckoutPreferenceRequest,
  CreateOrderRequest,
  ListAdminProductsQuery,
  CreatedOrder,
  ListAdminOrdersQuery,
  OrderTrackingView,
  UpdateAdminOrderFulfillmentRequest,
} from "../contracts";
import {
  attributesListSchema,
  cartAvailabilitySchema,
  catalogCollectionResponseSchema,
  catalogProductDetailResponseSchema,
  categoryTreeSchema,
  couponEvaluationSchema,
  relatedProductsSchema,
} from "./schemas";

export class ApiError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

export function resolveApiBaseUrl() {
  const configuredBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL?.trim();

  if (configuredBaseUrl) {
    return configuredBaseUrl.replace(/\/$/, "");
  }

  return "http://localhost:3000/api";
}

async function requestJson<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${resolveApiBaseUrl()}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  });

  if (!response.ok) {
    let message = `Request failed with status ${response.status}`;

    try {
      const payload = (await response.json()) as {
        message?: string | string[];
      };
      if (Array.isArray(payload.message)) {
        message = payload.message.join(", ");
      } else if (payload.message) {
        message = payload.message;
      }
    } catch {
      // Ignore JSON parse failures and keep the default message.
    }

    throw new ApiError(message, response.status);
  }

  return (await response.json()) as T;
}

async function requestAdminJson<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  return requestJson<T>(path, {
    ...init,
    credentials: "include",
  });
}

export function normalizeCatalogProductCard(
  product: CatalogProductDetail,
): CatalogProductCard {
  const primaryImage = product.images[0] ?? null;
  const firstVariant = product.variants[0] ?? null;

  return {
    id: product.id,
    slug: product.slug,
    name: product.name,
    description: product.description,
    status: product.status,
    category: product.category,
    variants: product.variants,
    primaryImageUrl: primaryImage?.assetUrl ?? null,
    primaryImageAlt: primaryImage?.altText ?? null,
    startingPriceAmount: firstVariant?.priceAmount ?? null,
    currencyCode: firstVariant?.currencyCode ?? null,
    attributes: product.attributes,
  };
}

function appendSearchParam(
  searchParams: URLSearchParams,
  key: string,
  value?: string,
) {
  const normalizedValue = value?.trim();

  if (normalizedValue) {
    searchParams.set(key, normalizedValue);
  }
}

function resolveCatalogFilters(filters?: string | CatalogFilters) {
  if (typeof filters === "string") {
    return { query: filters } satisfies CatalogFilters;
  }

  return filters ?? {};
}

export async function listCatalogProductCollection(
  filters?: string | CatalogFilters,
) {
  const resolvedFilters = resolveCatalogFilters(filters);
  const searchParams = new URLSearchParams();

  appendSearchParam(searchParams, "query", resolvedFilters.query);
  appendSearchParam(searchParams, "category", resolvedFilters.category);
  appendSearchParam(
    searchParams,
    "minPriceAmount",
    resolvedFilters.minPriceAmount,
  );
  appendSearchParam(
    searchParams,
    "maxPriceAmount",
    resolvedFilters.maxPriceAmount,
  );
  appendSearchParam(searchParams, "sort", resolvedFilters.sort);
  appendSearchParam(searchParams, "attributes", resolvedFilters.attributes);

  if (typeof resolvedFilters.page === "number") {
    searchParams.set("page", String(resolvedFilters.page));
  }

  if (typeof resolvedFilters.pageSize === "number") {
    searchParams.set("pageSize", String(resolvedFilters.pageSize));
  }

  const suffix = searchParams.size > 0 ? `?${searchParams.toString()}` : "";
  const payload = await requestJson<unknown>(`/catalog/products${suffix}`);
  const result = catalogCollectionResponseSchema.safeParse(payload);

  if (!result.success) {
    throw new ApiError("Respuesta inválida del servidor", 502);
  }

  return result.data satisfies CatalogCollectionResponse;
}

export async function listCatalogProducts(filters?: string | CatalogFilters) {
  const products = await listCatalogProductCollection(filters);

  return products.items.map(normalizeCatalogProductCard);
}

export async function getCatalogProduct(slug: string) {
  const payload = await requestJson<unknown>(`/catalog/products/${slug}`);
  const result = catalogProductDetailResponseSchema.safeParse(payload);

  if (!result.success) {
    throw new ApiError("Respuesta inválida del servidor", 502);
  }

  return result.data satisfies CatalogProductDetail;
}

export async function listAttributes(): Promise<AttributeOption[]> {
  const payload = await requestJson<unknown>("/catalog/attributes");
  const result = attributesListSchema.safeParse(payload);

  if (!result.success) {
    throw new ApiError("Respuesta inválida del servidor", 502);
  }

  return result.data;
}

export async function getRelatedProducts(
  slug: string,
): Promise<CatalogProductDetail[]> {
  const payload = await requestJson<unknown>(
    `/catalog/products/${slug}/related`,
  );
  const result = relatedProductsSchema.safeParse(payload);

  if (!result.success) {
    throw new ApiError("Respuesta inválida del servidor", 502);
  }

  return result.data;
}

export async function listCategoryTree(): Promise<CategoryNode[]> {
  const payload = await requestJson<unknown>("/catalog/categories");
  const result = categoryTreeSchema.safeParse(payload);

  if (!result.success) {
    throw new ApiError("Respuesta inválida del servidor", 502);
  }

  return result.data;
}

export async function validateCoupon(
  code: string,
  subtotalAmount: string,
): Promise<CouponEvaluation> {
  const payload = await requestJson<unknown>("/coupons/validate", {
    method: "POST",
    body: JSON.stringify({ code, subtotalAmount }),
  });
  const result = couponEvaluationSchema.safeParse(payload);

  if (!result.success) {
    throw new ApiError("Respuesta inválida del servidor", 502);
  }

  return result.data;
}

export async function checkCartAvailability(
  items: Array<{ variantId: string; quantity: number }>,
): Promise<CartAvailabilityLine[]> {
  const payload = await requestJson<unknown>("/catalog/availability", {
    method: "POST",
    body: JSON.stringify({ items }),
  });
  const result = cartAvailabilitySchema.safeParse(payload);

  if (!result.success) {
    throw new ApiError("Respuesta inválida del servidor", 502);
  }

  return result.data;
}

export function createOrder(payload: CreateOrderRequest) {
  return requestJson<CreatedOrder>("/orders", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function getOrderTracking(trackingToken: string) {
  return requestJson<OrderTrackingView>(`/orders/tracking/${trackingToken}`);
}

export function createCheckoutPreference(
  payload: CreateCheckoutPreferenceRequest,
) {
  return requestJson<CheckoutPreferenceResponse>(
    "/payments/checkout-preferences",
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
  );
}

export function loginAdmin(payload: { email: string; password: string }) {
  return requestAdminJson<AdminSession>("/admin/auth/login", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function logoutAdmin() {
  return requestAdminJson<{ success: boolean }>("/admin/auth/logout", {
    method: "POST",
  });
}

export function getCurrentAdmin() {
  return requestAdminJson<AdminSession>("/admin/auth/me");
}

export function listAdminProducts(query: string | ListAdminProductsQuery = {}) {
  const resolvedQuery = typeof query === "string" ? { query } : query;
  const searchParams = new URLSearchParams();

  appendSearchParam(searchParams, "query", resolvedQuery.query);
  appendSearchParam(searchParams, "status", resolvedQuery.status);
  appendSearchParam(searchParams, "categoryId", resolvedQuery.categoryId);

  const suffix = searchParams.size > 0 ? `?${searchParams.toString()}` : "";
  return requestAdminJson<AdminProduct[]>(`/admin/catalog/products${suffix}`);
}

export function createAdminProduct(payload: AdminProductInput) {
  return requestAdminJson<AdminProduct>("/admin/catalog/products", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateAdminProduct(
  productId: string,
  payload: Partial<AdminProductInput>,
) {
  return requestAdminJson<AdminProduct>(
    `/admin/catalog/products/${productId}`,
    {
      method: "PATCH",
      body: JSON.stringify(payload),
    },
  );
}

export function listAdminOrders(query: ListAdminOrdersQuery = {}) {
  const searchParams = new URLSearchParams();

  if (query.status?.trim()) {
    searchParams.set("status", query.status.trim());
  }

  if (query.fulfillmentStatus?.trim()) {
    searchParams.set("fulfillmentStatus", query.fulfillmentStatus.trim());
  }

  const suffix = searchParams.size > 0 ? `?${searchParams.toString()}` : "";
  return requestAdminJson<AdminOrder[]>(`/admin/orders${suffix}`);
}

export function updateAdminOrderFulfillment(
  orderId: string,
  payload: UpdateAdminOrderFulfillmentRequest,
) {
  return requestAdminJson<AdminOrder>(`/admin/orders/${orderId}/fulfillment`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export function cancelAdminOrder(orderId: string) {
  return requestAdminJson<AdminOrder>(`/admin/orders/${orderId}/cancel`, {
    method: "POST",
  });
}
