import assert from "node:assert/strict";
import test from "node:test";
import { normalizeCatalogProductCard } from "../lib/commerce/api.ts";
import {
  addCartLine,
  calculateCartTotals,
  createEmptyCheckoutFormState,
  createEmptyCartState,
  parseCartState,
  serializeCartState,
  toCreateOrderRequest,
  updateCartLineQuantity,
} from "../lib/commerce/cart.ts";

test("normalizeCatalogProductCard maps backend product detail into storefront card fields", () => {
  const result = normalizeCatalogProductCard({
    id: "product-1",
    slug: "aurora-speaker",
    name: "Aurora Speaker",
    description: "Portable audio.",
    status: "ACTIVE",
    variants: [
      {
        id: "variant-1",
        sku: "SKU-1",
        name: "Sand",
        priceAmount: "129900",
        currencyCode: "ARS",
      },
    ],
    images: [
      {
        id: "image-1",
        assetUrl: "https://cdn.example.com/aurora.jpg",
        assetKey: "aurora.jpg",
        altText: "Aurora speaker",
        sortOrder: 0,
      },
    ],
  });

  assert.deepEqual(result, {
    id: "product-1",
    slug: "aurora-speaker",
    name: "Aurora Speaker",
    description: "Portable audio.",
    status: "ACTIVE",
    variants: [
      {
        id: "variant-1",
        sku: "SKU-1",
        name: "Sand",
        priceAmount: "129900",
        currencyCode: "ARS",
      },
    ],
    primaryImageUrl: "https://cdn.example.com/aurora.jpg",
    primaryImageAlt: "Aurora speaker",
    startingPriceAmount: "129900",
    currencyCode: "ARS",
  });
});

test("cart helpers merge duplicate variants, update quantities, and compute totals", () => {
  const firstPass = addCartLine(createEmptyCartState(), {
    variantId: "variant-1",
    sku: "SKU-1",
    productId: "product-1",
    productSlug: "aurora-speaker",
    productName: "Aurora Speaker",
    variantName: "Sand",
    unitPriceAmount: "129900",
    currencyCode: "ARS",
    imageUrl: null,
    imageAlt: null,
    quantity: 1,
  });
  const merged = addCartLine(firstPass, {
    ...firstPass.lines[0],
    quantity: 2,
  });
  const updated = updateCartLineQuantity(merged, "variant-1", 4);

  assert.equal(updated.lines.length, 1);
  assert.equal(updated.lines[0]?.quantity, 4);
  assert.deepEqual(calculateCartTotals(updated), {
    itemCount: 4,
    subtotalAmount: "519600",
    currencyCode: "ARS",
  });
});

test("cart helpers serialize persistence state and shape the backend order payload", () => {
  const state = addCartLine(createEmptyCartState(), {
    variantId: "variant-2",
    sku: "SKU-2",
    productId: "product-2",
    productSlug: "halo-lamp",
    productName: "Halo Lamp",
    variantName: "Brass",
    unitPriceAmount: "84900",
    currencyCode: "ARS",
    imageUrl: "https://cdn.example.com/halo.jpg",
    imageAlt: "Halo lamp",
    quantity: 2,
  });
  const rehydrated = parseCartState(serializeCartState(state));
  const checkoutForm = {
    ...createEmptyCheckoutFormState(),
    fullName: "Ada Buyer",
    email: "ada@example.com",
    phone: "11 5555 1111",
    recipientName: "Ada Buyer",
    shippingPhone: "11 5555 1111",
    streetLine1: "Cabildo 123",
    locality: "CABA",
    province: "CABA",
    postalCode: "C1426",
  };

  assert.deepEqual(rehydrated, state);
  assert.deepEqual(toCreateOrderRequest(state, checkoutForm), {
    items: [{ variantId: "variant-2", quantity: 2 }],
    contact: {
      fullName: "Ada Buyer",
      email: "ada@example.com",
      phone: "11 5555 1111",
    },
    shippingAddress: {
      recipientName: "Ada Buyer",
      phone: "11 5555 1111",
      streetLine1: "Cabildo 123",
      streetLine2: undefined,
      locality: "CABA",
      province: "CABA",
      postalCode: "C1426",
      deliveryNotes: undefined,
    },
  });
});
