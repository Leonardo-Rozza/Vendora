import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { CatalogProductDetail } from "@/lib/contracts";

// Mock the commerce provider so the PDP can render in isolation and we can
// assert on the exact add-to-cart payload without touching localStorage/state.
const addToCart = vi.fn();
vi.mock("@/components/commerce/commerce-provider", () => ({
  useCommerce: () => ({ addToCart }),
}));

import { ProductDetailClient } from "@/components/product/product-detail-client";

// Intl currency formatting uses a non-breaking space; normalise before matching.
function hasMoney(amount: string) {
  return (_content: string, element: Element | null) => {
    const text = element?.textContent?.replace(/ /g, " ") ?? "";
    return text.includes(amount) && (element?.children.length ?? 0) === 0;
  };
}

function buildProduct(
  overrides: Partial<CatalogProductDetail> = {},
): CatalogProductDetail {
  return {
    id: "product-1",
    slug: "mate-imperial",
    name: "Mate Imperial",
    description: "Un mate listo para la ronda.",
    status: "ACTIVE",
    category: { id: "cat-1", name: "Hogar", slug: "hogar" },
    images: [
      {
        id: "img-1",
        assetUrl: "https://cdn.example.com/mate.jpg",
        assetKey: "products/mate",
        altText: "Mate",
        sortOrder: 0,
      },
    ],
    attributes: [],
    variants: [
      {
        id: "variant-negro",
        sku: "MATE-NEGRO",
        name: "Negro",
        priceAmount: "12000",
        currencyCode: "ARS",
        availableQuantity: 8,
      },
      {
        id: "variant-azul",
        sku: "MATE-AZUL",
        name: "Azul",
        priceAmount: "15000",
        currencyCode: "ARS",
        availableQuantity: 2,
      },
    ],
    ...overrides,
  };
}

beforeEach(() => {
  addToCart.mockClear();
});

afterEach(() => {
  cleanup();
});

test("selecting a variant updates the displayed price, SKU and stock", async () => {
  render(<ProductDetailClient product={buildProduct()} />);

  // Default variant (first) is shown.
  expect(screen.getByText("SKU MATE-NEGRO")).toBeInTheDocument();
  expect(screen.getByText(hasMoney("$ 12.000"))).toBeInTheDocument();

  await userEvent.click(screen.getByRole("button", { name: "Azul" }));

  expect(screen.getByText("SKU MATE-AZUL")).toBeInTheDocument();
  expect(screen.getByText(hasMoney("$ 15.000"))).toBeInTheDocument();
  // The Azul variant only has 2 units → "Ultimas unidades disponibles (2)".
  expect(
    screen.getByText(/Ultimas unidades disponibles \(2\)/),
  ).toBeInTheDocument();
});

test("quantity is clamped to the selected variant stock and never below 1", async () => {
  render(<ProductDetailClient product={buildProduct()} />);

  const plus = screen.getByRole("button", { name: "Sumar" });
  const minus = screen.getByRole("button", { name: "Restar" });
  const readout = document.querySelector(
    '[aria-live="polite"]',
  ) as HTMLElement;

  expect(readout).toHaveTextContent("1");

  // Bump to 3 on the high-stock variant.
  await userEvent.click(plus);
  await userEvent.click(plus);
  expect(readout).toHaveTextContent("3");

  // Switching to the 2-unit variant clamps the displayed quantity down to 2.
  await userEvent.click(screen.getByRole("button", { name: "Azul" }));
  expect(readout).toHaveTextContent("2");

  // Cannot exceed the variant stock: the + button is disabled at the max.
  expect(screen.getByRole("button", { name: "Sumar" })).toBeDisabled();

  // Cannot go below 1: drop to 1 and the - button disables.
  await userEvent.click(minus);
  expect(readout).toHaveTextContent("1");
  expect(screen.getByRole("button", { name: "Restar" })).toBeDisabled();
});

test("add-to-cart is disabled when the selected variant is out of stock", async () => {
  const product = buildProduct({
    variants: [
      {
        id: "variant-agotado",
        sku: "MATE-AGOTADO",
        name: "Agotado",
        priceAmount: "12000",
        currencyCode: "ARS",
        availableQuantity: 0,
      },
    ],
  });

  render(<ProductDetailClient product={product} />);

  const cta = screen.getByRole("button", { name: /Variante sin stock/ });
  expect(cta).toBeDisabled();
});

test("add-to-cart calls the provider with the selected variant and clamped quantity", async () => {
  render(<ProductDetailClient product={buildProduct()} />);

  await userEvent.click(screen.getByRole("button", { name: "Azul" }));
  // Try to push beyond the 2-unit cap; clamp keeps it at 2.
  await userEvent.click(screen.getByRole("button", { name: "Sumar" }));

  await userEvent.click(
    screen.getByRole("button", { name: /Agregar variante al carrito/ }),
  );

  expect(addToCart).toHaveBeenCalledTimes(1);
  expect(addToCart).toHaveBeenCalledWith(
    expect.objectContaining({
      variantId: "variant-azul",
      sku: "MATE-AZUL",
      productId: "product-1",
      unitPriceAmount: "15000",
      currencyCode: "ARS",
      quantity: 2,
    }),
  );
});

test("a confirmation toast appears after adding to the cart", async () => {
  render(<ProductDetailClient product={buildProduct()} />);

  await userEvent.click(
    screen.getByRole("button", { name: /Agregar variante al carrito/ }),
  );

  const toast = screen.getByRole("status");
  expect(
    within(toast).getByText(/Mate Imperial \(Negro\) agregado al carrito/),
  ).toBeInTheDocument();
});
