import { afterEach, expect, test, vi } from "vitest";
import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  NEXT_FULFILLMENT_STATUS,
  OrderList,
  canAdvanceFulfillment,
  canCancelOrder,
} from "@/components/admin/order-list";
import type { AdminOrder, FulfillmentStatus } from "@/lib/contracts";

function buildOrder(overrides: Partial<AdminOrder> = {}): AdminOrder {
  return {
    id: "order-1",
    status: "PAID",
    fulfillmentStatus: "REQUESTED",
    currencyCode: "ARS",
    subtotalAmount: "12000",
    totalAmount: "12000",
    contactFullName: "Ada Buyer",
    contactEmail: "ada@example.com",
    contactPhone: "11 5555 1111",
    shippingRecipientName: "Ada Buyer",
    shippingPhone: "11 5555 1111",
    shippingStreetLine1: "Cabildo 123",
    shippingStreetLine2: null,
    shippingLocality: "Vicente Lopez",
    shippingProvince: "Buenos Aires",
    shippingPostalCode: "B1638",
    shippingDeliveryNotes: null,
    fulfillmentNotes: null,
    deliveryReference: null,
    paidAt: null,
    items: [],
    payments: [{ status: "APPROVED" }],
    ...overrides,
  };
}

afterEach(() => {
  cleanup();
});

test("fulfillment transitions follow the operational order and terminate at DELIVERED", () => {
  expect(NEXT_FULFILLMENT_STATUS.REQUESTED).toBe("CONFIRMED");
  expect(NEXT_FULFILLMENT_STATUS.CONFIRMED).toBe("PREPARING");
  expect(NEXT_FULFILLMENT_STATUS.PREPARING).toBe("READY_FOR_DELIVERY");
  expect(NEXT_FULFILLMENT_STATUS.READY_FOR_DELIVERY).toBe("OUT_FOR_DELIVERY");
  expect(NEXT_FULFILLMENT_STATUS.OUT_FOR_DELIVERY).toBe("DELIVERED");
  expect(NEXT_FULFILLMENT_STATUS.DELIVERED).toBeNull();
});

test("cancel is only allowed before the order is PAID or CANCELLED", () => {
  expect(canCancelOrder("PENDING")).toBe(true);
  expect(canCancelOrder("PAID")).toBe(false);
  expect(canCancelOrder("CANCELLED")).toBe(false);
});

test("fulfillment can only advance for PAID orders with a next state", () => {
  expect(canAdvanceFulfillment("PAID", "REQUESTED")).toBe(true);
  expect(canAdvanceFulfillment("PAID", "DELIVERED")).toBe(false);
  expect(canAdvanceFulfillment("PENDING", "REQUESTED")).toBe(false);
});

function renderList(orders: AdminOrder[]) {
  const onAdvanceFulfillment = vi.fn().mockResolvedValue(undefined);
  const onCancel = vi.fn().mockResolvedValue(undefined);
  const onFulfillmentFilterChange = vi.fn();

  render(
    <OrderList
      orders={orders}
      onAdvanceFulfillment={onAdvanceFulfillment}
      onCancel={onCancel}
      onFulfillmentFilterChange={onFulfillmentFilterChange}
      selectedFulfillmentFilter="ALL"
    />,
  );

  return { onAdvanceFulfillment, onCancel, onFulfillmentFilterChange };
}

test("a paid order locks cancel and enables advancing fulfillment", () => {
  renderList([buildOrder({ status: "PAID", fulfillmentStatus: "REQUESTED" })]);

  expect(
    screen.getByRole("button", { name: /Pedido bloqueado/ }),
  ).toBeDisabled();
  expect(
    screen.getByRole("button", { name: /Mover a Confirmado/ }),
  ).toBeEnabled();
});

test("an unpaid order enables cancel and blocks fulfillment", () => {
  renderList([
    buildOrder({ status: "PENDING", fulfillmentStatus: "REQUESTED" }),
  ]);

  expect(screen.getByRole("button", { name: /Cancelar pedido/ })).toBeEnabled();
  expect(
    screen.getByRole("button", { name: /Espera pago antes de avanzar/ }),
  ).toBeDisabled();
});

test("advancing fulfillment calls the handler with the next status", async () => {
  const { onAdvanceFulfillment } = renderList([
    buildOrder({ status: "PAID", fulfillmentStatus: "CONFIRMED" }),
  ]);

  await userEvent.click(
    screen.getByRole("button", { name: /Mover a Preparando/ }),
  );

  expect(onAdvanceFulfillment).toHaveBeenCalledWith(
    "order-1",
    expect.objectContaining({ fulfillmentStatus: "PREPARING" }),
  );
});

test("client-side pagination shows 10 orders per page and reveals the rest on page 2", async () => {
  const orders = Array.from({ length: 12 }, (_, index) =>
    buildOrder({ id: `order-${index + 1}` }),
  );

  renderList(orders);

  // Each order renders its id as a monospace heading paragraph.
  expect(screen.getByText("order-1")).toBeInTheDocument();
  expect(screen.getByText("order-10")).toBeInTheDocument();
  expect(screen.queryByText("order-11")).not.toBeInTheDocument();

  const nav = screen.getByRole("navigation", { name: /Paginación/ });
  await userEvent.click(within(nav).getByRole("button", { name: "2" }));

  expect(screen.getByText("order-11")).toBeInTheDocument();
  expect(screen.getByText("order-12")).toBeInTheDocument();
  expect(screen.queryByText("order-1")).not.toBeInTheDocument();
});

test("no pagination control renders when there are 10 or fewer orders", () => {
  const orders = Array.from({ length: 10 }, (_, index) =>
    buildOrder({ id: `order-${index + 1}` }),
  );

  renderList(orders);

  expect(
    screen.queryByRole("navigation", { name: /Paginación/ }),
  ).not.toBeInTheDocument();
});

const statuses: FulfillmentStatus[] = [
  "REQUESTED",
  "CONFIRMED",
  "PREPARING",
  "READY_FOR_DELIVERY",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
];

test("the chain of next states forms a complete forward path", () => {
  const path: FulfillmentStatus[] = ["REQUESTED"];
  let cursor: FulfillmentStatus | null = "REQUESTED";
  while ((cursor = NEXT_FULFILLMENT_STATUS[cursor]) !== null) {
    path.push(cursor);
  }
  expect(path).toEqual(statuses);
});
