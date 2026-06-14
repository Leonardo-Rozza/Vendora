import { afterEach, expect, test, vi } from "vitest";
import { act, cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { AdminProduct, CategoryNode } from "@/lib/contracts";

// The editor fetches categories and attributes on mount; stub both so the
// component renders deterministically without hitting the network.
vi.mock("@/lib/commerce/api", () => ({
  listCategoryTree: vi.fn().mockResolvedValue([]),
  listAttributes: vi.fn().mockResolvedValue([]),
}));

import {
  ProductEditor,
  flattenCategoryTree,
  productPrice,
  productStock,
  readRequiredString,
} from "@/components/admin/product-editor";

function buildProduct(overrides: Partial<AdminProduct> = {}): AdminProduct {
  return {
    id: "product-1",
    slug: "mate-imperial",
    name: "Mate Imperial",
    description: null,
    status: "ACTIVE",
    category: { id: "cat-1", name: "Hogar", slug: "hogar" },
    images: [],
    variants: [
      {
        id: "variant-1",
        sku: "MATE-1",
        name: "Negro",
        priceAmount: "12000",
        currencyCode: "ARS",
        inventoryItem: { availableQuantity: 5, reservedQuantity: 0 },
      },
    ],
    ...overrides,
  };
}

afterEach(() => {
  cleanup();
});

test("readRequiredString trims valid input and rejects blank values", () => {
  expect(readRequiredString("  Mate  ", "Nombre")).toBe("Mate");
  expect(() => readRequiredString("   ", "Nombre")).toThrowError(
    "Nombre es obligatorio.",
  );
});

test("productStock sums inventory across variants, preferring inventoryItem", () => {
  const product = buildProduct({
    variants: [
      {
        id: "v1",
        sku: "A",
        name: "A",
        priceAmount: "1",
        currencyCode: "ARS",
        inventoryItem: { availableQuantity: 4, reservedQuantity: 0 },
      },
      {
        id: "v2",
        sku: "B",
        name: "B",
        priceAmount: "1",
        currencyCode: "ARS",
        availableQuantity: 3,
      },
      {
        id: "v3",
        sku: "C",
        name: "C",
        priceAmount: "1",
        currencyCode: "ARS",
      },
    ],
  });

  expect(productStock(product)).toBe(7);
});

test("productPrice uses the first variant and falls back to a dash when empty", () => {
  expect(productPrice(buildProduct())).toMatch(/12\.000/);
  expect(productPrice(buildProduct({ variants: [] }))).toBe("—");
});

test("flattenCategoryTree records the nesting depth depth-first", () => {
  const tree: CategoryNode[] = [
    {
      id: "root",
      name: "Hogar",
      slug: "hogar",
      parentId: null,
      sortOrder: 0,
      children: [
        {
          id: "child",
          name: "Cocina",
          slug: "cocina",
          parentId: "root",
          sortOrder: 0,
          children: [],
        },
      ],
    },
  ];

  expect(flattenCategoryTree(tree)).toEqual([
    { id: "root", name: "Hogar", depth: 0 },
    { id: "child", name: "Cocina", depth: 1 },
  ]);
});

async function renderEditor(products: AdminProduct[]) {
  render(
    <ProductEditor
      products={products}
      onCreate={vi.fn().mockResolvedValue(undefined)}
      onUpdate={vi.fn().mockResolvedValue(undefined)}
    />,
  );
  // Flush the mocked category/attribute fetch effects before asserting.
  await act(async () => {
    await Promise.resolve();
  });
}

test("product list paginates at 10 rows and reveals the rest on page 2", async () => {
  const products = Array.from({ length: 12 }, (_, index) =>
    buildProduct({ id: `product-${index + 1}`, name: `Producto ${index + 1}` }),
  );

  await renderEditor(products);

  expect(screen.getByText("Producto 1")).toBeInTheDocument();
  expect(screen.getByText("Producto 10")).toBeInTheDocument();
  expect(screen.queryByText("Producto 11")).not.toBeInTheDocument();

  const nav = screen.getByRole("navigation", { name: /Paginación/ });
  await userEvent.click(within(nav).getByRole("button", { name: "2" }));

  expect(screen.getByText("Producto 11")).toBeInTheDocument();
  expect(screen.getByText("Producto 12")).toBeInTheDocument();
  expect(screen.queryByText("Producto 1")).not.toBeInTheDocument();
});

test("no pagination control renders for 10 or fewer products", async () => {
  const products = Array.from({ length: 10 }, (_, index) =>
    buildProduct({ id: `product-${index + 1}`, name: `Producto ${index + 1}` }),
  );

  await renderEditor(products);

  expect(
    screen.queryByRole("navigation", { name: /Paginación/ }),
  ).not.toBeInTheDocument();
});
