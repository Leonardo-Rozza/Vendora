import type {
  CatalogProductCard,
  CatalogProductDetail,
  CheckoutPreferenceResponse,
  CreateCheckoutPreferenceRequest,
  CreateOrderRequest,
  CreatedOrder,
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
    variants: product.variants,
    primaryImageUrl: primaryImage?.assetUrl ?? null,
    primaryImageAlt: primaryImage?.altText ?? null,
    startingPriceAmount: firstVariant?.priceAmount ?? null,
    currencyCode: firstVariant?.currencyCode ?? null,
  };
}

export async function listCatalogProducts(query?: string) {
  const searchParams = new URLSearchParams();

  if (query?.trim()) {
    searchParams.set("query", query.trim());
  }

  const suffix = searchParams.size > 0 ? `?${searchParams.toString()}` : "";
  const products = await requestJson<CatalogProductDetail[]>(`/catalog/products${suffix}`);

  return products.map(normalizeCatalogProductCard);
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
