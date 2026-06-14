import { test, expect } from "vitest";
import {
  canStartCheckout,
  isWithinAmbaShippingScope,
  resolveTrackingPath,
  toCheckoutErrorMessage,
  validateCheckoutForm,
} from "../lib/commerce/checkout.ts";
import { createEmptyCheckoutFormState } from "../lib/commerce/cart.ts";
import type { CheckoutFormState, CheckoutSnapshot } from "../lib/contracts.ts";

function validForm(overrides: Partial<CheckoutFormState> = {}): CheckoutFormState {
  return {
    ...createEmptyCheckoutFormState(),
    fullName: "Ada Lovelace",
    email: "ada@example.com",
    phone: "1122334455",
    recipientName: "Ada",
    shippingPhone: "1100002222",
    streetLine1: "Calle 1",
    locality: "Avellaneda",
    province: "Buenos Aires",
    postalCode: "1870",
    ...overrides,
  };
}

test("canStartCheckout requires items and an idle submit state", () => {
  expect(canStartCheckout({ isSubmitting: false, lineCount: 2 })).toBe(true);
  expect(canStartCheckout({ isSubmitting: true, lineCount: 2 })).toBe(false);
  expect(canStartCheckout({ isSubmitting: false, lineCount: 0 })).toBe(false);
});

test("validateCheckoutForm flags missing required fields", () => {
  const message = validateCheckoutForm(validForm({ streetLine1: "  " }));

  expect(message).toMatch(/Completa los datos/i);
});

test("validateCheckoutForm rejects destinations outside CABA/AMBA", () => {
  const message = validateCheckoutForm(
    validForm({ province: "Buenos Aires", locality: "La Plata" }),
  );

  expect(message).toMatch(/CABA y AMBA/i);
});

test("validateCheckoutForm passes for a complete AMBA destination", () => {
  expect(validateCheckoutForm(validForm())).toBeNull();
});

test("isWithinAmbaShippingScope accepts CABA in all its spellings", () => {
  for (const province of [
    "CABA",
    "Capital Federal",
    "Ciudad Autónoma de Buenos Aires",
  ]) {
    expect(
      isWithinAmbaShippingScope({ province, locality: "Centro" }),
    ).toBe(true);
  }
});

test("isWithinAmbaShippingScope normalizes accents and casing for AMBA localities", () => {
  expect(
    isWithinAmbaShippingScope({ province: "Buenos Aires", locality: "Morón" }),
  ).toBe(true);
  expect(
    isWithinAmbaShippingScope({ province: "buenos aires", locality: "ITUZAINGÓ" }),
  ).toBe(true);
});

test("isWithinAmbaShippingScope rejects Buenos Aires localities outside AMBA", () => {
  expect(
    isWithinAmbaShippingScope({ province: "Buenos Aires", locality: "Mar del Plata" }),
  ).toBe(false);
});

test("isWithinAmbaShippingScope rejects empty values", () => {
  expect(isWithinAmbaShippingScope({ province: "", locality: "Avellaneda" })).toBe(
    false,
  );
  expect(isWithinAmbaShippingScope({ province: "Buenos Aires", locality: "  " })).toBe(
    false,
  );
});

test("toCheckoutErrorMessage surfaces API error messages", () => {
  const apiError = Object.assign(new Error("Cupón vencido"), { status: 422 });

  expect(toCheckoutErrorMessage(apiError)).toBe("Cupón vencido");
});

test("toCheckoutErrorMessage falls back for unknown failures", () => {
  expect(toCheckoutErrorMessage(new Error("boom"))).toMatch(/Intenta nuevamente/i);
  expect(toCheckoutErrorMessage("weird")).toMatch(/Intenta nuevamente/i);
});

test("resolveTrackingPath prefers an explicit url path", () => {
  const snapshot = {
    trackingUrlPath: "/seguimiento/custom",
    trackingToken: "tok-1",
  } as CheckoutSnapshot;

  expect(resolveTrackingPath(snapshot)).toBe("/seguimiento/custom");
});

test("resolveTrackingPath builds a path from the token when no url path exists", () => {
  const snapshot = { trackingToken: "tok-1" } as CheckoutSnapshot;

  expect(resolveTrackingPath(snapshot)).toBe("/seguimiento/tok-1");
});

test("resolveTrackingPath returns null without tracking data", () => {
  expect(resolveTrackingPath(null)).toBeNull();
  expect(resolveTrackingPath({} as CheckoutSnapshot)).toBeNull();
});
