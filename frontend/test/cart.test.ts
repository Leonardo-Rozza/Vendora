import { test, expect } from "vitest";
import {
  addCartLine,
  calculateCartTotals,
  clearCart,
  createEmptyCartState,
  parseCartState,
  removeCartLine,
  serializeCartState,
  setLastCheckoutSnapshot,
  toCreateOrderRequest,
  updateCartLineQuantity,
} from "../lib/commerce/cart.ts";
import { createEmptyCheckoutFormState } from "../lib/commerce/cart.ts";
import type { CartLine, CartState, CheckoutSnapshot } from "../lib/contracts.ts";

function makeLine(overrides: Partial<CartLine> = {}): CartLine {
  return {
    variantId: "var-1",
    sku: "SKU-1",
    productId: "prod-1",
    productSlug: "remera-base",
    productName: "Remera base",
    variantName: "Talle M",
    unitPriceAmount: "1500",
    currencyCode: "ARS",
    imageUrl: null,
    imageAlt: null,
    quantity: 1,
    ...overrides,
  };
}

test("addCartLine appends a new variant", () => {
  const state = addCartLine(createEmptyCartState(), makeLine());

  expect(state.lines).toHaveLength(1);
  expect(state.lines[0]?.variantId).toBe("var-1");
  expect(state.lines[0]?.quantity).toBe(1);
});

test("addCartLine merges quantities for an existing variant", () => {
  const initial = addCartLine(createEmptyCartState(), makeLine({ quantity: 2 }));
  const merged = addCartLine(initial, makeLine({ quantity: 3 }));

  expect(merged.lines).toHaveLength(1);
  expect(merged.lines[0]?.quantity).toBe(5);
});

test("addCartLine keeps distinct variants separate", () => {
  const initial = addCartLine(createEmptyCartState(), makeLine());
  const next = addCartLine(initial, makeLine({ variantId: "var-2", sku: "SKU-2" }));

  expect(next.lines).toHaveLength(2);
});

test("updateCartLineQuantity sets a new quantity", () => {
  const initial = addCartLine(createEmptyCartState(), makeLine({ quantity: 1 }));
  const updated = updateCartLineQuantity(initial, "var-1", 4);

  expect(updated.lines[0]?.quantity).toBe(4);
});

test("updateCartLineQuantity removes the line when quantity drops to zero or below", () => {
  const initial = addCartLine(createEmptyCartState(), makeLine());

  expect(updateCartLineQuantity(initial, "var-1", 0).lines).toHaveLength(0);
  expect(updateCartLineQuantity(initial, "var-1", -3).lines).toHaveLength(0);
});

test("removeCartLine drops only the targeted variant", () => {
  const state: CartState = {
    lines: [makeLine(), makeLine({ variantId: "var-2", sku: "SKU-2" })],
    lastCheckout: null,
  };

  const next = removeCartLine(state, "var-1");

  expect(next.lines).toHaveLength(1);
  expect(next.lines[0]?.variantId).toBe("var-2");
});

test("clearCart empties the lines but preserves the rest of the state", () => {
  const state = setLastCheckoutSnapshot(
    addCartLine(createEmptyCartState(), makeLine()),
    { orderId: "order-1" } as CheckoutSnapshot,
  );

  const cleared = clearCart(state);

  expect(cleared.lines).toHaveLength(0);
  expect(cleared.lastCheckout).toEqual({ orderId: "order-1" });
});

test("calculateCartTotals sums item count and subtotal across lines", () => {
  const state: CartState = {
    lines: [
      makeLine({ unitPriceAmount: "1500", quantity: 2 }),
      makeLine({ variantId: "var-2", unitPriceAmount: "500", quantity: 3 }),
    ],
    lastCheckout: null,
  };

  const totals = calculateCartTotals(state);

  expect(totals.itemCount).toBe(5);
  expect(totals.subtotalAmount).toBe("4500");
  expect(totals.currencyCode).toBe("ARS");
});

test("calculateCartTotals defaults to ARS for an empty cart", () => {
  const totals = calculateCartTotals(createEmptyCartState());

  expect(totals.itemCount).toBe(0);
  expect(totals.subtotalAmount).toBe("0");
  expect(totals.currencyCode).toBe("ARS");
});

test("serializeCartState and parseCartState round-trip", () => {
  const state = addCartLine(createEmptyCartState(), makeLine({ quantity: 2 }));
  const parsed = parseCartState(serializeCartState(state));

  expect(parsed).toEqual(state);
});

test("parseCartState falls back to an empty cart on missing or invalid input", () => {
  expect(parseCartState(null)).toEqual(createEmptyCartState());
  expect(parseCartState(undefined)).toEqual(createEmptyCartState());
  expect(parseCartState("not-json")).toEqual(createEmptyCartState());
});

test("parseCartState tolerates a payload without a lines array", () => {
  const parsed = parseCartState(JSON.stringify({ lastCheckout: null }));

  expect(parsed.lines).toEqual([]);
  expect(parsed.lastCheckout).toBeNull();
});

test("toCreateOrderRequest maps items, trims fields and omits empty optionals", () => {
  const state: CartState = {
    lines: [makeLine({ quantity: 2 }), makeLine({ variantId: "var-2", quantity: 1 })],
    lastCheckout: null,
  };
  const form = {
    ...createEmptyCheckoutFormState(),
    fullName: "  Ada Lovelace ",
    email: " ada@example.com ",
    phone: " 1122334455 ",
    recipientName: " Ada ",
    shippingPhone: " 1100002222 ",
    streetLine1: " Calle 1 ",
    streetLine2: "   ",
    locality: " Avellaneda ",
    province: " Buenos Aires ",
    postalCode: " 1870 ",
    deliveryNotes: "   ",
  };

  const request = toCreateOrderRequest(state, form);

  expect(request.items).toEqual([
    { variantId: "var-1", quantity: 2 },
    { variantId: "var-2", quantity: 1 },
  ]);
  expect(request.contact).toEqual({
    fullName: "Ada Lovelace",
    email: "ada@example.com",
    phone: "1122334455",
  });
  expect(request.shippingAddress.streetLine2).toBeUndefined();
  expect(request.shippingAddress.deliveryNotes).toBeUndefined();
  expect(request.shippingAddress.locality).toBe("Avellaneda");
  expect(request).not.toHaveProperty("couponCode");
});

test("toCreateOrderRequest includes a trimmed coupon code when provided", () => {
  const state = addCartLine(createEmptyCartState(), makeLine());
  const request = toCreateOrderRequest(
    state,
    createEmptyCheckoutFormState(),
    "  VERANO10 ",
  );

  expect(request.couponCode).toBe("VERANO10");
});

test("toCreateOrderRequest omits a blank coupon code", () => {
  const state = addCartLine(createEmptyCartState(), makeLine());
  const request = toCreateOrderRequest(state, createEmptyCheckoutFormState(), "   ");

  expect(request).not.toHaveProperty("couponCode");
});
