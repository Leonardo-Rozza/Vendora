"use client";

import { useState } from "react";
import { toCheckoutErrorMessage } from "@/lib/commerce/checkout";
import { formatMoney } from "@/lib/commerce/format";
import type {
  AdminOrder,
  FulfillmentStatus,
  UpdateAdminOrderFulfillmentRequest,
} from "@/lib/contracts";
import { appCopy } from "@/lib/copy/es-ar";

const FULFILLMENT_LABELS: Record<FulfillmentStatus, string> = {
  REQUESTED: "Solicitado",
  CONFIRMED: "Confirmado",
  PREPARING: "Preparando",
  READY_FOR_DELIVERY: "Listo para envio",
  OUT_FOR_DELIVERY: "En reparto",
  DELIVERED: "Entregado",
};

const NEXT_FULFILLMENT_STATUS: Record<
  FulfillmentStatus,
  FulfillmentStatus | null
> = {
  REQUESTED: "CONFIRMED",
  CONFIRMED: "PREPARING",
  PREPARING: "READY_FOR_DELIVERY",
  READY_FOR_DELIVERY: "OUT_FOR_DELIVERY",
  OUT_FOR_DELIVERY: "DELIVERED",
  DELIVERED: null,
};

const FULFILLMENT_FILTERS: Array<FulfillmentStatus | "ALL"> = [
  "ALL",
  "REQUESTED",
  "CONFIRMED",
  "PREPARING",
  "READY_FOR_DELIVERY",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
];

type OrderListProps = {
  orders: AdminOrder[];
  onAdvanceFulfillment: (
    orderId: string,
    payload: UpdateAdminOrderFulfillmentRequest,
  ) => Promise<void>;
  onCancel: (orderId: string) => Promise<void>;
  onFulfillmentFilterChange: (status: FulfillmentStatus | "ALL") => void;
  selectedFulfillmentFilter: FulfillmentStatus | "ALL";
};

export function OrderList({
  orders,
  onAdvanceFulfillment,
  onCancel,
  onFulfillmentFilterChange,
  selectedFulfillmentFilter,
}: OrderListProps) {
  const copy = appCopy.adminOrders;
  const [error, setError] = useState<string | null>(null);
  const [pendingActionKey, setPendingActionKey] = useState<string | null>(null);
  const [notesByOrderId, setNotesByOrderId] = useState<Record<string, string>>(
    {},
  );
  const [referencesByOrderId, setReferencesByOrderId] = useState<
    Record<string, string>
  >({});

  async function handleCancel(orderId: string) {
    setPendingActionKey(`cancel:${orderId}`);
    setError(null);

    try {
      await onCancel(orderId);
    } catch (caughtError) {
      setError(toCheckoutErrorMessage(caughtError));
    } finally {
      setPendingActionKey(null);
    }
  }

  async function handleAdvanceFulfillment(order: AdminOrder) {
    const nextFulfillmentStatus =
      NEXT_FULFILLMENT_STATUS[order.fulfillmentStatus];

    if (!nextFulfillmentStatus) {
      return;
    }

    setPendingActionKey(`fulfillment:${order.id}`);
    setError(null);

    try {
      await onAdvanceFulfillment(order.id, {
        fulfillmentStatus: nextFulfillmentStatus,
        fulfillmentNotes: notesByOrderId[order.id],
        deliveryReference: referencesByOrderId[order.id],
      });
    } catch (caughtError) {
      setError(toCheckoutErrorMessage(caughtError));
    } finally {
      setPendingActionKey(null);
    }
  }

  return (
    <section
      className="rounded-[1.75rem] border border-[var(--line-soft)] bg-[var(--surface-panel)] p-5"
      id="admin-pedidos"
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.3em] text-[var(--ink-soft)]">
            {copy.eyebrow}
          </p>
          <h3 className="mt-3 text-2xl font-semibold tracking-[-0.04em] text-[var(--ink-strong)]">
            {copy.title}
          </h3>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <label className="text-sm font-medium text-[var(--ink-muted)]">
            {copy.filterLabel}
            <select
              className="mt-2 w-full rounded-full border border-[var(--line-soft)] bg-white px-4 py-2 text-sm text-[var(--ink-strong)] sm:min-w-52"
              onChange={(event) =>
                onFulfillmentFilterChange(
                  event.target.value as FulfillmentStatus | "ALL",
                )
              }
              value={selectedFulfillmentFilter}
            >
              {FULFILLMENT_FILTERS.map((status) => (
                <option key={status} value={status}>
                  {status === "ALL"
                    ? copy.allQueues
                    : FULFILLMENT_LABELS[status]}
                </option>
              ))}
            </select>
          </label>
          <span className="rounded-full border border-[var(--line-soft)] bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-[var(--brand-deep)]">
            {orders.length} {copy.ordersCount}
          </span>
        </div>
      </div>

      <div className="mt-5 space-y-4">
        {error ? (
          <div className="rounded-[1rem] border border-[var(--warning-line)] bg-[var(--warning-surface)] px-4 py-3 text-sm text-[var(--brand-deep)]">
            {error}
          </div>
        ) : null}
        {orders.length === 0 ? (
          <div className="rounded-[1rem] border border-dashed border-[var(--line-soft)] bg-white/60 px-4 py-5 text-sm text-[var(--ink-muted)]">
            {selectedFulfillmentFilter === "ALL"
              ? copy.emptyAll
              : `${copy.emptyFilteredPrefix} ${FULFILLMENT_LABELS[selectedFulfillmentFilter]}.`}
          </div>
        ) : null}

        {orders.map((order) => {
          const canCancel =
            order.status !== "PAID" && order.status !== "CANCELLED";
          const nextFulfillmentStatus =
            NEXT_FULFILLMENT_STATUS[order.fulfillmentStatus];
          const canAdvanceFulfillment =
            order.status === "PAID" && nextFulfillmentStatus !== null;
          const paymentStatus = order.payments[0]?.status ?? "PENDING";

          return (
            <article
              key={order.id}
              className="rounded-[1.4rem] border border-[var(--line-soft)] bg-white/78 p-4"
            >
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div>
                  <p className="font-mono text-xs uppercase tracking-[0.24em] text-[var(--ink-soft)]">
                    {order.id}
                  </p>
                  <h4 className="mt-2 text-lg font-semibold text-[var(--ink-strong)]">
                    {order.contactFullName}
                  </h4>
                  <p className="mt-1 text-sm text-[var(--ink-muted)]">
                    {order.contactEmail} · {order.contactPhone}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold uppercase tracking-[0.18em]">
                    <span className="rounded-full border border-[var(--line-soft)] bg-white px-3 py-1 text-[var(--ink-strong)]">
                      {copy.commercial} {order.status}
                    </span>
                    <span className="rounded-full border border-[var(--line-soft)] bg-[var(--surface-panel)] px-3 py-1 text-[var(--brand-deep)]">
                      {copy.fulfillment}{" "}
                      {FULFILLMENT_LABELS[order.fulfillmentStatus]}
                    </span>
                    <span className="rounded-full border border-[var(--line-soft)] bg-white px-3 py-1 text-[var(--ink-muted)]">
                      {copy.payment} {paymentStatus}
                    </span>
                    {order.buyerTrackingLabel ? (
                      <span className="rounded-full border border-[var(--line-soft)] bg-[var(--surface-panel)] px-3 py-1 text-[var(--brand-deep)]">
                        {copy.buyerTracking} {order.buyerTrackingLabel}
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-3 text-sm text-[var(--ink-muted)]">
                    {order.shippingRecipientName} · {order.shippingStreetLine1}
                    {order.shippingStreetLine2
                      ? `, ${order.shippingStreetLine2}`
                      : ""}{" "}
                    · {order.shippingLocality}, {order.shippingProvince}
                  </p>
                  <p className="mt-2 text-sm text-[var(--ink-muted)]">
                    CP {order.shippingPostalCode} · {order.shippingPhone}
                  </p>
                  {order.trackingCode || order.trackingUrlPath ? (
                    <div className="mt-3 rounded-[1rem] border border-[var(--line-soft)] bg-[var(--surface-panel)] px-4 py-3 text-sm text-[var(--ink-muted)]">
                      {order.trackingCode ? (
                        <p>
                          {copy.trackingCode}: {order.trackingCode}
                        </p>
                      ) : null}
                      {order.buyerTrackingDescription ? (
                        <p className="mt-2 leading-7">
                          {order.buyerTrackingDescription}
                        </p>
                      ) : null}
                      {order.trackingUrlPath ? (
                        <a
                          className="mt-3 inline-flex rounded-full border border-[var(--line-soft)] bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--brand-deep)]"
                          href={order.trackingUrlPath}
                          rel="noreferrer"
                          target="_blank"
                        >
                          {copy.openTracking}
                        </a>
                      ) : null}
                    </div>
                  ) : null}
                </div>
                <div className="flex flex-col items-start gap-3 md:items-end">
                  <strong className="text-lg text-[var(--ink-strong)]">
                    {formatMoney(order.totalAmount, order.currencyCode)}
                  </strong>
                  <button
                    className="rounded-full border border-[var(--line-soft)] px-4 py-2 text-sm font-semibold disabled:opacity-50"
                    disabled={
                      !canCancel || pendingActionKey === `cancel:${order.id}`
                    }
                    onClick={() => void handleCancel(order.id)}
                    type="button"
                  >
                    {pendingActionKey === `cancel:${order.id}`
                      ? copy.cancelling
                      : canCancel
                        ? copy.cancel
                        : copy.locked}
                  </button>
                  {!canCancel && order.status === "PAID" ? (
                    <p className="max-w-xs text-right text-xs text-[var(--ink-muted)]">
                      {copy.cannotCancelPaid}
                    </p>
                  ) : null}
                </div>
              </div>

              <div className="mt-4 grid gap-3 rounded-[1rem] border border-[var(--line-soft)] bg-white/70 p-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--ink-soft)]">
                    {copy.notes}
                  </p>
                  <textarea
                    className="mt-2 min-h-24 w-full rounded-[1rem] border border-[var(--line-soft)] bg-white px-4 py-3 text-sm text-[var(--ink-strong)]"
                    onChange={(event) =>
                      setNotesByOrderId((current) => ({
                        ...current,
                        [order.id]: event.target.value,
                      }))
                    }
                    placeholder={order.fulfillmentNotes ?? copy.addNote}
                    value={notesByOrderId[order.id] ?? ""}
                  />
                  {order.fulfillmentNotes ? (
                    <p className="mt-2 text-xs text-[var(--ink-muted)]">
                      {copy.currentNote}: {order.fulfillmentNotes}
                    </p>
                  ) : null}
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--ink-soft)]">
                    {copy.reference}
                  </p>
                  <input
                    className="mt-2 w-full rounded-[1rem] border border-[var(--line-soft)] bg-white px-4 py-3 text-sm text-[var(--ink-strong)]"
                    onChange={(event) =>
                      setReferencesByOrderId((current) => ({
                        ...current,
                        [order.id]: event.target.value,
                      }))
                    }
                    placeholder={order.deliveryReference ?? copy.addReference}
                    value={referencesByOrderId[order.id] ?? ""}
                  />
                  <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-[var(--ink-muted)]">
                    <span>
                      {order.paidAt
                        ? `Pago confirmado ${new Date(order.paidAt).toLocaleString()}`
                        : copy.awaitingPayment}
                    </span>
                    {order.deliveryReference ? (
                      <span>
                        {copy.currentReference}: {order.deliveryReference}
                      </span>
                    ) : null}
                  </div>
                  <button
                    className="mt-4 rounded-full bg-[var(--brand-deep)] px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
                    disabled={
                      !canAdvanceFulfillment ||
                      pendingActionKey === `fulfillment:${order.id}`
                    }
                    onClick={() => void handleAdvanceFulfillment(order)}
                    type="button"
                  >
                    {pendingActionKey === `fulfillment:${order.id}`
                      ? copy.advancing
                      : canAdvanceFulfillment && nextFulfillmentStatus
                        ? `${copy.advance} ${FULFILLMENT_LABELS[nextFulfillmentStatus]}`
                        : order.status === "PAID"
                          ? copy.done
                          : copy.waitPayment}
                  </button>
                </div>
              </div>

              <div className="mt-4 rounded-[1rem] border border-[var(--line-soft)] bg-[var(--surface-panel)] p-4 text-sm text-[var(--ink-muted)]">
                <p className="mb-2 font-semibold text-[var(--ink-strong)]">
                  {copy.orderItems}
                </p>
                {order.items.map((item) => (
                  <p key={`${order.id}-${item.variantId}`}>
                    {item.quantity} x {item.productName} / {item.variantName} (
                    {item.sku})
                  </p>
                ))}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
