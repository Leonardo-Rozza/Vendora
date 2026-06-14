import { afterEach, expect, test } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import {
  TrackingTimeline,
  resolveStates,
} from "@/components/order-tracking/tracking-timeline";
import type {
  BuyerTrackingStatus,
  OrderTrackingMilestone,
} from "@/lib/contracts";

function buildMilestones(count: number): OrderTrackingMilestone[] {
  return Array.from({ length: count }, (_, index) => ({
    id: `milestone-${index}`,
    type: `STEP_${index}`,
    title: `Paso ${index + 1}`,
    description: `Descripcion ${index + 1}`,
    occurredAt: "2026-03-13T00:00:00.000Z",
    deliveryReference: null,
  }));
}

afterEach(() => {
  cleanup();
});

test("non-terminal status marks the newest milestone as current and older ones as done", () => {
  const states = resolveStates(3, "PREPARANDO_PEDIDO");
  expect(states).toEqual(["done", "done", "current"]);
});

test("terminal ENTREGADO status marks every milestone as done", () => {
  expect(resolveStates(3, "ENTREGADO")).toEqual(["done", "done", "done"]);
});

test("terminal CANCELADO status marks every milestone as done", () => {
  expect(resolveStates(2, "CANCELADO")).toEqual(["done", "done"]);
});

test("a single in-progress milestone is current, not done", () => {
  expect(resolveStates(1, "EN_CAMINO")).toEqual(["current"]);
});

const STATUSES: BuyerTrackingStatus[] = [
  "PAGO_PENDIENTE",
  "PAGO_CONFIRMADO",
  "PREPARANDO_PEDIDO",
  "LISTO_PARA_ENTREGA",
  "EN_CAMINO",
];

test.each(STATUSES)(
  "the current step shows the 'Ahora' badge for status %s",
  (status) => {
    render(
      <TrackingTimeline
        milestones={buildMilestones(3)}
        status={status}
        timelineTitle="Linea de tiempo"
        referenceLabel="Referencia"
        currentLabel="Ahora"
      />,
    );

    // Exactly one milestone is flagged as current.
    const badges = screen.getAllByText("Ahora");
    expect(badges).toHaveLength(1);
    // The current milestone is the newest (last) one.
    expect(screen.getByText("Paso 3").parentElement).toContainElement(
      badges[0]!,
    );
  },
);

test("a delivered order shows no 'Ahora' badge because every step is done", () => {
  render(
    <TrackingTimeline
      milestones={buildMilestones(3)}
      status="ENTREGADO"
      timelineTitle="Linea de tiempo"
      referenceLabel="Referencia"
      currentLabel="Ahora"
    />,
  );

  expect(screen.queryByText("Ahora")).not.toBeInTheDocument();
});

test("delivery references are surfaced under their milestone", () => {
  const milestones = buildMilestones(2);
  milestones[1] = { ...milestones[1]!, deliveryReference: "OPS-42" };

  render(
    <TrackingTimeline
      milestones={milestones}
      status="EN_CAMINO"
      timelineTitle="Linea de tiempo"
      referenceLabel="Referencia de envio"
      currentLabel="Ahora"
    />,
  );

  expect(screen.getByText("Referencia de envio")).toBeInTheDocument();
  expect(screen.getByText("OPS-42")).toBeInTheDocument();
});
