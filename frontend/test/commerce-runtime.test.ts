import assert from "node:assert/strict";
import test from "node:test";
import {
  ApiError,
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
  toCheckoutErrorMessage,
  validateCheckoutForm,
} from "../lib/commerce/checkout.ts";
import { createEmptyCheckoutFormState } from "../lib/commerce/cart.ts";

test("catalog error helper surfaces retryable API failures", () => {
  assert.equal(
    toCatalogErrorMessage(new ApiError("Backend unavailable", 503)),
    "Backend unavailable",
  );
  assert.equal(
    toCatalogErrorMessage(new Error("boom")),
    "Catalog is temporarily unavailable.",
  );
});

test("checkout helper blocks duplicate submissions and empty carts", () => {
  assert.equal(canStartCheckout({ isSubmitting: false, lineCount: 1 }), true);
  assert.equal(canStartCheckout({ isSubmitting: true, lineCount: 1 }), false);
  assert.equal(canStartCheckout({ isSubmitting: false, lineCount: 0 }), false);
});

test("checkout error helper preserves API validation messages", () => {
  assert.equal(
    toCheckoutErrorMessage(new ApiError("Quantity must not be less than 1", 400)),
    "Quantity must not be less than 1",
  );
  assert.equal(
    toCheckoutErrorMessage(new Error("boom")),
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

  assert.deepEqual(withParams, {
    orderReference: "order-live",
    paymentReference: "payment-live",
  });
  assert.deepEqual(withoutParams, {
    orderReference: null,
    paymentReference: null,
  });
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

  assert.equal(
    validateCheckoutForm(emptyForm),
    "Completa los datos de contacto y entrega antes de continuar.",
  );
  assert.equal(validateCheckoutForm(validForm), null);
  assert.equal(
    validateCheckoutForm({ ...validForm, locality: "Rosario", province: "Santa Fe" }),
    "Por ahora solo hacemos envios dentro de CABA y AMBA.",
  );
  assert.equal(
    isWithinAmbaShippingScope({ locality: "CABA", province: "CABA" }),
    true,
  );
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

  assert.equal(seenRequests.length, 1);
  assert.match(seenRequests[0]!.url, /\/admin\/orders\?fulfillmentStatus=PREPARING$/);
  assert.equal(seenRequests[0]!.init?.credentials, "include");
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

    assert.deepEqual(response.filters.applied, {
      query: "mate",
      category: "HOGAR",
      minPriceAmount: "9000",
      maxPriceAmount: "12000",
      sort: "price-asc",
    });
  } finally {
    global.fetch = originalFetch;
  }

  assert.equal(seenRequests.length, 1);
  assert.match(
    seenRequests[0]!.url,
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

  assert.equal(seenRequests.length, 1);
  assert.match(
    seenRequests[0]!.url,
    /\/admin\/catalog\/products\?status=ACTIVE&category=ACCESORIOS$/,
  );
  assert.equal(seenRequests[0]!.init?.credentials, "include");
});

test("admin fulfillment helper sends a patch request with the transition payload", async () => {
  const originalFetch = global.fetch;
  const seenRequests: Array<{ url: string; init?: RequestInit }> = [];

  global.fetch = (async (input: string | URL | Request, init?: RequestInit) => {
    seenRequests.push({ url: String(input), init });

    return new Response(JSON.stringify({ id: "order-1", fulfillmentStatus: "CONFIRMED" }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
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

  assert.equal(seenRequests.length, 1);
  assert.match(seenRequests[0]!.url, /\/admin\/orders\/order-1\/fulfillment$/);
  assert.equal(seenRequests[0]!.init?.method, "PATCH");
  assert.equal(seenRequests[0]!.init?.credentials, "include");
  assert.match(String(seenRequests[0]!.init?.body), /"fulfillmentStatus":"CONFIRMED"/);
});

test("api helper resolves the configured API base url without a trailing slash", () => {
  const originalBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
  process.env.NEXT_PUBLIC_API_BASE_URL = "https://vendora.example.com/api/";

  try {
    assert.equal(resolveApiBaseUrl(), "https://vendora.example.com/api");
  } finally {
    process.env.NEXT_PUBLIC_API_BASE_URL = originalBaseUrl;
  }
});
