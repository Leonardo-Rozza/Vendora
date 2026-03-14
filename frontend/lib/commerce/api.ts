import type {
  AdminOrder,
  AdminProduct,
  AdminProductInput,
  AdminSession,
  CatalogCollectionResponse,
  CatalogFilters,
   CatalogProductCard,
   CatalogProductDetail,
   CheckoutPreferenceResponse,
   CreateCheckoutPreferenceRequest,
   CreateOrderRequest,
   ListAdminProductsQuery,
   CreatedOrder,
   ListAdminOrdersQuery,
   UpdateAdminOrderFulfillmentRequest,
} from "../contracts";

export class ApiError extends Error {
  readonly status: number;

  constructor(
    message: string,
    status: number,
  ) {
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
      const payload = (await response.json()) as { message?: string | string[] };
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

async function requestAdminJson<T>(path: string, init?: RequestInit): Promise<T> {
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
  };
}

function appendSearchParam(searchParams: URLSearchParams, key: string, value?: string) {
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

export async function listCatalogProductCollection(filters?: string | CatalogFilters) {
  const resolvedFilters = resolveCatalogFilters(filters);
  const searchParams = new URLSearchParams();

  appendSearchParam(searchParams, "query", resolvedFilters.query);
  appendSearchParam(searchParams, "category", resolvedFilters.category);
  appendSearchParam(searchParams, "minPriceAmount", resolvedFilters.minPriceAmount);
  appendSearchParam(searchParams, "maxPriceAmount", resolvedFilters.maxPriceAmount);
  appendSearchParam(searchParams, "sort", resolvedFilters.sort);

  const suffix = searchParams.size > 0 ? `?${searchParams.toString()}` : "";
  return requestJson<CatalogCollectionResponse>(`/catalog/products${suffix}`);
}

export async function listCatalogProducts(filters?: string | CatalogFilters) {
  const products = await listCatalogProductCollection(filters);

  return products.items.map(normalizeCatalogProductCard);
}

export function getCatalogProduct(slug: string) {
  return requestJson<CatalogProductDetail>(`/catalog/products/${slug}`);
}

export function createOrder(payload: CreateOrderRequest) {
  return requestJson<CreatedOrder>("/orders", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function createCheckoutPreference(
  payload: CreateCheckoutPreferenceRequest,
) {
  return requestJson<CheckoutPreferenceResponse>("/payments/checkout-preferences", {
    method: "POST",
    body: JSON.stringify(payload),
  });
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
  appendSearchParam(searchParams, "category", resolvedQuery.category);

  const suffix = searchParams.size > 0 ? `?${searchParams.toString()}` : "";
  return requestAdminJson<AdminProduct[]>(`/admin/catalog/products${suffix}`);
}

export function createAdminProduct(payload: AdminProductInput) {
  return requestAdminJson<AdminProduct>("/admin/catalog/products", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateAdminProduct(productId: string, payload: Partial<AdminProductInput>) {
  return requestAdminJson<AdminProduct>(`/admin/catalog/products/${productId}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
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
