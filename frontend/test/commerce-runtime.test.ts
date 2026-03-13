import assert from "node:assert/strict";
import test from "node:test";
import { ApiError } from "../lib/commerce/api.ts";
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
    "Checkout could not be prepared. Please retry.",
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
    "Complete the contact and shipping fields before continuing.",
  );
  assert.equal(validateCheckoutForm(validForm), null);
  assert.equal(
    validateCheckoutForm({ ...validForm, locality: "Rosario", province: "Santa Fe" }),
    "Shipping is currently limited to AMBA destinations.",
  );
  assert.equal(
    isWithinAmbaShippingScope({ locality: "CABA", province: "CABA" }),
    true,
  );
});
