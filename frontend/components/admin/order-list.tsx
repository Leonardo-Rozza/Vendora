"use client";

import { useEffect, useState } from "react";
import { toCheckoutErrorMessage } from "@/lib/commerce/checkout";
import { formatMoney } from "@/lib/commerce/format";
import { Badge, Button, Pagination, cn } from "@/components/ui";
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

const FULFILLMENT_TONE: Record<
  FulfillmentStatus,
  "info" | "warning" | "brand" | "success"
> = {
  REQUESTED: "info",
  CONFIRMED: "info",
  PREPARING: "warning",
  READY_FOR_DELIVERY: "warning",
  OUT_FOR_DELIVERY: "brand",
  DELIVERED: "success",
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

const ORDERS_PER_PAGE = 10;

export function OrderList({
  orders,
  onAdvanceFulfillment,
  onCancel,
  onFulfillmentFilterChange,
  selectedFulfillmentFilter,
}: OrderListProps) {
  const copy = appCopy.adminOrders;
  const [error, setError] = useState<string | null>(null);
  const [listPage, setListPage] = useState(1);
  const [pendingActionKey, setPendingActionKey] = useState<string | null>(null);
  const [notesByOrderId, setNotesByOrderId] = useState<Record<string, string>>(
    {},
  );
  const [referencesByOrderId, setReferencesByOrderId] = useState<
    Record<string, string>
  >({});

  // The fulfillment filter refetches server-side; reset to the first page so the
  // user doesn't land on an out-of-range page after the list shrinks.
  useEffect(() => {
    setListPage(1);
  }, [selectedFulfillmentFilter]);

  const pageCount = Math.max(1, Math.ceil(orders.length / ORDERS_PER_PAGE));
  const currentPage = Math.min(listPage, pageCount);
  const pagedOrders = orders.slice(
    (currentPage - 1) * ORDERS_PER_PAGE,
    currentPage * ORDERS_PER_PAGE,
  );

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
    <section id="admin-pedidos">
      <h1 className="text-[26px] font-extrabold tracking-[-0.02em] text-ink-strong">
        {copy.title}
      </h1>
      <p className="mt-1 mb-[18px] text-sm text-ink-soft">
        {orders.length} {copy.ordersCount}
      </p>

      <div className="mb-[18px] flex flex-wrap gap-[7px]">
        {FULFILLMENT_FILTERS.map((status) => {
          const active = selectedFulfillmentFilter === status;
          return (
            <button
              key={status}
              className={cn(
                "rounded-[9px] border-[1.5px] px-[13px] py-[7px] text-[13px] font-bold transition-colors outline-none focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-accent-sand",
                active
                  ? "border-brand-deep bg-brand-deep text-surface-base"
                  : "border-line-strong bg-surface-panel text-ink-muted hover:border-brand-deep",
              )}
              onClick={() => onFulfillmentFilterChange(status)}
              type="button"
            >
              {status === "ALL" ? copy.allQueues : FULFILLMENT_LABELS[status]}
            </button>
          );
        })}
      </div>

      {error ? (
        <div
          className="mb-4 rounded-card border border-warning-line bg-warning-surface px-4 py-3 text-sm text-brand-deep"
          role="alert"
        >
          {error}
        </div>
      ) : null}

      {orders.length === 0 ? (
        <div className="rounded-card border border-dashed border-line-soft bg-surface-panel px-5 py-8 text-sm text-ink-muted">
          {selectedFulfillmentFilter === "ALL"
            ? copy.emptyAll
            : `${copy.emptyFilteredPrefix} ${FULFILLMENT_LABELS[selectedFulfillmentFilter]}.`}
        </div>
      ) : null}

      <div className="space-y-4">
        {pagedOrders.map((order) => {
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
              className="rounded-card border border-line-soft bg-surface-panel p-[22px]"
            >
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div>
                  <p className="font-mono text-xs uppercase tracking-[0.1em] text-ink-soft">
                    {order.id}
                  </p>
                  <h4 className="mt-2 text-lg font-bold text-ink-strong">
                    {order.contactFullName}
                  </h4>
                  <p className="mt-1 text-sm text-ink-muted">
                    {order.contactEmail} · {order.contactPhone}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Badge tone="neutral">
                      {copy.commercial} {order.status}
                    </Badge>
                    <Badge tone={FULFILLMENT_TONE[order.fulfillmentStatus]}>
                      {copy.fulfillment} {FULFILLMENT_LABELS[order.fulfillmentStatus]}
                    </Badge>
                    <Badge tone="neutral">
                      {copy.payment} {paymentStatus}
                    </Badge>
                    {order.buyerTrackingLabel ? (
                      <Badge tone="info">
                        {copy.buyerTracking} {order.buyerTrackingLabel}
                      </Badge>
                    ) : null}
                  </div>
                  <p className="mt-3 text-sm text-ink-muted">
                    {order.shippingRecipientName} · {order.shippingStreetLine1}
                    {order.shippingStreetLine2
                      ? `, ${order.shippingStreetLine2}`
                      : ""}{" "}
                    · {order.shippingLocality}, {order.shippingProvince}
                  </p>
                  <p className="mt-2 text-sm text-ink-muted">
                    CP {order.shippingPostalCode} · {order.shippingPhone}
                  </p>
                  {order.trackingCode || order.trackingUrlPath ? (
                    <div className="mt-3 rounded-field border border-line-soft bg-surface-sand px-4 py-3 text-sm text-ink-muted">
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
                          className="mt-3 inline-flex rounded-full border border-line-strong bg-surface-panel px-4 py-2 text-xs font-bold uppercase tracking-[0.1em] text-brand-deep"
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
                  <strong className="text-lg font-extrabold text-ink-strong">
                    {formatMoney(order.totalAmount, order.currencyCode)}
                  </strong>
                  <Button
                    disabled={
                      !canCancel || pendingActionKey === `cancel:${order.id}`
                    }
                    onClick={() => void handleCancel(order.id)}
                    size="sm"
                    variant="secondary"
                  >
                    {pendingActionKey === `cancel:${order.id}`
                      ? copy.cancelling
                      : canCancel
                        ? copy.cancel
                        : copy.locked}
                  </Button>
                  {!canCancel && order.status === "PAID" ? (
                    <p className="max-w-xs text-right text-xs text-ink-muted">
                      {copy.cannotCancelPaid}
                    </p>
                  ) : null}
                </div>
              </div>

              <div className="mt-4 grid gap-3 rounded-field border border-line-soft bg-surface-sand p-4 lg:grid-cols-2">
                <div>
                  <p className="font-mono text-xs uppercase tracking-[0.1em] text-ink-soft">
                    {copy.notes}
                  </p>
                  <textarea
                    aria-label={`${copy.notes} ${order.id}`}
                    className="mt-2 min-h-24 w-full resize-y rounded-field border-[1.5px] border-line-strong bg-surface-panel px-3.5 py-3 text-[15px] text-ink-strong outline-none transition placeholder:text-ink-soft focus-visible:border-brand-deep focus-visible:outline-3 focus-visible:outline-offset-0 focus-visible:outline-[#e7cfae]"
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
                    <p className="mt-2 text-xs text-ink-muted">
                      {copy.currentNote}: {order.fulfillmentNotes}
                    </p>
                  ) : null}
                </div>

                <div>
                  <p className="font-mono text-xs uppercase tracking-[0.1em] text-ink-soft">
                    {copy.reference}
                  </p>
                  <input
                    aria-label={`${copy.reference} ${order.id}`}
                    className="mt-2 w-full rounded-field border-[1.5px] border-line-strong bg-surface-panel px-3.5 py-3 text-[15px] text-ink-strong outline-none transition placeholder:text-ink-soft focus-visible:border-brand-deep focus-visible:outline-3 focus-visible:outline-offset-0 focus-visible:outline-[#e7cfae]"
                    onChange={(event) =>
                      setReferencesByOrderId((current) => ({
                        ...current,
                        [order.id]: event.target.value,
                      }))
                    }
                    placeholder={order.deliveryReference ?? copy.addReference}
                    value={referencesByOrderId[order.id] ?? ""}
                  />
                  <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-ink-muted">
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
                  <Button
                    className="mt-4"
                    disabled={
                      !canAdvanceFulfillment ||
                      pendingActionKey === `fulfillment:${order.id}`
                    }
                    onClick={() => void handleAdvanceFulfillment(order)}
                    size="sm"
                  >
                    {pendingActionKey === `fulfillment:${order.id}`
                      ? copy.advancing
                      : canAdvanceFulfillment && nextFulfillmentStatus
                        ? `${copy.advance} ${FULFILLMENT_LABELS[nextFulfillmentStatus]}`
                        : order.status === "PAID"
                          ? copy.done
                          : copy.waitPayment}
                  </Button>
                </div>
              </div>

              <div className="mt-4 rounded-field border border-line-soft bg-surface-sand p-4 text-sm text-ink-muted">
                <p className="mb-2 font-bold text-ink-strong">
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

      {pageCount > 1 ? (
        <div className="mt-5 flex justify-end">
          <Pagination
            page={currentPage}
            pageCount={pageCount}
            onPageChange={setListPage}
          />
        </div>
      ) : null}
    </section>
  );
}
