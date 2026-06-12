import { test, expect } from "vitest";
import {
  ApiError,
  getOrderTracking,
  listAdminProducts,
  listAdminOrders,
  listCatalogProductCollection,
  resolveApiBaseUrl,
  updateAdminOrderFulfillment,
} from "../lib/commerce/api.ts";
import { toCatalogErrorMessage } from "../lib/commerce/catalog.ts";
import {
  canStartCheckout,
  isWithinAmbaShippingScope,
  resolveCheckoutReferences,
  resolveTrackingPath,
  toCheckoutErrorMessage,
  validateCheckoutForm,
} from "../lib/commerce/checkout.ts";
import { createEmptyCheckoutFormState } from "../lib/commerce/cart.ts";

test("catalog error helper surfaces retryable API failures", () => {
  expect(toCatalogErrorMessage(new ApiError("Backend unavailable", 503))).toBe(
    "Backend unavailable",
  );
  expect(toCatalogErrorMessage(new Error("boom"))).toBe(
    "Catalog is temporarily unavailable.",
  );
});

test("checkout helper blocks duplicate submissions and empty carts", () => {
  expect(canStartCheckout({ isSubmitting: false, lineCount: 1 })).toBe(true);
  expect(canStartCheckout({ isSubmitting: true, lineCount: 1 })).toBe(false);
  expect(canStartCheckout({ isSubmitting: false, lineCount: 0 })).toBe(false);
});

test("checkout error helper preserves API validation messages", () => {
  expect(
    toCheckoutErrorMessage(new ApiError("Quantity must not be less than 1", 400)),
  ).toBe("Quantity must not be less than 1");
  expect(toCheckoutErrorMessage(new Error("boom"))).toBe(
    "No pudimos preparar el checkout. Intenta nuevamente.",
  );
});

test("checkout reference helper prefers redirect params and falls back to snapshot", () => {
  const withParams = resolveCheckoutReferences({
    searchParams: new URLSearchParams({
      external_reference: "order-live",
      payment_id: "payment-live",
    }),
    snapshot: {
      orderId: "order-saved",
      paymentId: "payment-saved",
      preferenceId: "pref-1",
      trackingToken: "tracking-live",
      trackingCode: "VEN-1234-5678-ABCD",
      trackingUrlPath: "/seguimiento/tracking-live",
      itemCount: 1,
      totalAmount: "84900",
      currencyCode: "ARS",
      submittedAt: "2026-03-13T00:00:00.000Z",
    },
  });
  const withoutParams = resolveCheckoutReferences({
    searchParams: new URLSearchParams(),
    snapshot: null,
  });

  expect(withParams).toEqual({
    orderReference: "order-live",
    paymentReference: "payment-live",
  });
  expect(withoutParams).toEqual({
    orderReference: null,
    paymentReference: null,
  });
  expect(
    resolveTrackingPath(
      withParams
        ? {
            orderId: "order-saved",
            paymentId: "payment-saved",
            preferenceId: "pref-1",
            trackingToken: "tracking-live",
            trackingCode: "VEN-1234-5678-ABCD",
            trackingUrlPath: "/seguimiento/tracking-live",
            itemCount: 1,
            totalAmount: "84900",
            currencyCode: "ARS",
            submittedAt: "2026-03-13T00:00:00.000Z",
          }
        : null,
    ),
  ).toBe("/seguimiento/tracking-live");
});

test("tracking helper requests the buyer-safe tracking endpoint", async () => {
  const originalFetch = global.fetch;
  const seenRequests: Array<{ url: string; init?: RequestInit }> = [];

  global.fetch = (async (input: string | URL | Request, init?: RequestInit) => {
    seenRequests.push({ url: String(input), init });

    return new Response(
      JSON.stringify({ orderId: "order-1", trackingToken: "tracking-1" }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    );
  }) as typeof global.fetch;

  try {
    await getOrderTracking("tracking-1");
  } finally {
    global.fetch = originalFetch;
  }

  expect(seenRequests.length).toBe(1);
  expect(seenRequests[0]!.url).toMatch(/\/orders\/tracking\/tracking-1$/);
});

test("checkout validation requires delivery fields and rejects non-AMBA destinations", () => {
  const emptyForm = createEmptyCheckoutFormState();
  const validForm = {
    ...emptyForm,
    fullName: "Ada Buyer",
    email: "ada@example.com",
    phone: "11 5555 1111",
    recipientName: "Ada Buyer",
    shippingPhone: "11 5555 1111",
    streetLine1: "Cabildo 123",
    locality: "Vicente Lopez",
    province: "Buenos Aires",
    postalCode: "B1638",
  };

  expect(validateCheckoutForm(emptyForm)).toBe(
    "Completa los datos de contacto y entrega antes de continuar.",
  );
  expect(validateCheckoutForm(validForm)).toBe(null);
  expect(
    validateCheckoutForm({
      ...validForm,
      locality: "Rosario",
      province: "Santa Fe",
    }),
  ).toBe("Por ahora solo hacemos envios dentro de CABA y AMBA.");
  expect(
    isWithinAmbaShippingScope({ locality: "CABA", province: "CABA" }),
  ).toBe(true);
});

test("admin order helper appends fulfillment filters to the query string", async () => {
  const originalFetch = global.fetch;
  const seenRequests: Array<{ url: string; init?: RequestInit }> = [];

  global.fetch = (async (input: string | URL | Request, init?: RequestInit) => {
    seenRequests.push({ url: String(input), init });

    return new Response(JSON.stringify([]), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }) as typeof global.fetch;

  try {
    await listAdminOrders({ fulfillmentStatus: "PREPARING" });
  } finally {
    global.fetch = originalFetch;
  }

  expect(seenRequests.length).toBe(1);
  expect(seenRequests[0]!.url).toMatch(
    /\/admin\/orders\?fulfillmentStatus=PREPARING$/,
  );
  expect(seenRequests[0]!.init?.credentials).toBe("include");
});

test("catalog collection helper appends category, price, and sort filters", async () => {
  const originalFetch = global.fetch;
  const seenRequests: Array<{ url: string; init?: RequestInit }> = [];

  global.fetch = (async (input: string | URL | Request, init?: RequestInit) => {
    seenRequests.push({ url: String(input), init });

    return new Response(
      JSON.stringify({
        items: [],
        filters: {
          categories: [{ value: "HOGAR", count: 1 }],
          priceRange: { minAmount: "9000.00", maxAmount: "12000.00" },
          availableSorts: ["featured", "price-asc", "price-desc", "newest"],
          applied: {
            query: "mate",
            category: "HOGAR",
            minPriceAmount: "9000",
            maxPriceAmount: "12000",
            sort: "price-asc",
          },
        },
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    );
  }) as typeof global.fetch;

  try {
    const response = await listCatalogProductCollection({
      query: "mate",
      category: "HOGAR",
      minPriceAmount: "9000",
      maxPriceAmount: "12000",
      sort: "price-asc",
    });

    expect(response.filters.applied).toEqual({
      query: "mate",
      category: "HOGAR",
      minPriceAmount: "9000",
      maxPriceAmount: "12000",
      sort: "price-asc",
    });
  } finally {
    global.fetch = originalFetch;
  }

  expect(seenRequests.length).toBe(1);
  expect(seenRequests[0]!.url).toMatch(
    /\/catalog\/products\?query=mate&category=HOGAR&minPriceAmount=9000&maxPriceAmount=12000&sort=price-asc$/,
  );
});

test("admin product helper appends category and status filters to the query string", async () => {
  const originalFetch = global.fetch;
  const seenRequests: Array<{ url: string; init?: RequestInit }> = [];

  global.fetch = (async (input: string | URL | Request, init?: RequestInit) => {
    seenRequests.push({ url: String(input), init });

    return new Response(JSON.stringify([]), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }) as typeof global.fetch;

  try {
    await listAdminProducts({ status: "ACTIVE", category: "ACCESORIOS" });
  } finally {
    global.fetch = originalFetch;
  }

  expect(seenRequests.length).toBe(1);
  expect(seenRequests[0]!.url).toMatch(
    /\/admin\/catalog\/products\?status=ACTIVE&category=ACCESORIOS$/,
  );
  expect(seenRequests[0]!.init?.credentials).toBe("include");
});

test("admin fulfillment helper sends a patch request with the transition payload", async () => {
  const originalFetch = global.fetch;
  const seenRequests: Array<{ url: string; init?: RequestInit }> = [];

  global.fetch = (async (input: string | URL | Request, init?: RequestInit) => {
    seenRequests.push({ url: String(input), init });

    return new Response(
      JSON.stringify({ id: "order-1", fulfillmentStatus: "CONFIRMED" }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    );
  }) as typeof global.fetch;

  try {
    await updateAdminOrderFulfillment("order-1", {
      fulfillmentStatus: "CONFIRMED",
      fulfillmentNotes: "Ready for picker",
      deliveryReference: "OPS-1",
    });
  } finally {
    global.fetch = originalFetch;
  }

  expect(seenRequests.length).toBe(1);
  expect(seenRequests[0]!.url).toMatch(/\/admin\/orders\/order-1\/fulfillment$/);
  expect(seenRequests[0]!.init?.method).toBe("PATCH");
  expect(seenRequests[0]!.init?.credentials).toBe("include");
  expect(String(seenRequests[0]!.init?.body)).toMatch(
    /"fulfillmentStatus":"CONFIRMED"/,
  );
});

test("api helper resolves the configured API base url without a trailing slash", () => {
  const originalBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
  process.env.NEXT_PUBLIC_API_BASE_URL = "https://vendora.example.com/api/";

  try {
    expect(resolveApiBaseUrl()).toBe("https://vendora.example.com/api");
  } finally {
    process.env.NEXT_PUBLIC_API_BASE_URL = originalBaseUrl;
  }
});
