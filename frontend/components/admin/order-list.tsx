"use client";

import { useState } from "react";
import { toCheckoutErrorMessage } from "@/lib/commerce/checkout";
import { formatMoney } from "@/lib/commerce/format";
import type { AdminOrder } from "@/lib/contracts";

type OrderListProps = {
  orders: AdminOrder[];
  onCancel: (orderId: string) => Promise<void>;
};

export function OrderList({ orders, onCancel }: OrderListProps) {
  const [error, setError] = useState<string | null>(null);
  const [pendingOrderId, setPendingOrderId] = useState<string | null>(null);

  async function handleCancel(orderId: string) {
    setPendingOrderId(orderId);
    setError(null);

    try {
      await onCancel(orderId);
    } catch (caughtError) {
      setError(toCheckoutErrorMessage(caughtError));
    } finally {
      setPendingOrderId(null);
    }
  }

  return (
    <section className="rounded-[1.75rem] border border-[var(--line-soft)] bg-[var(--surface-panel)] p-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.3em] text-[var(--ink-soft)]">
            Order visibility
          </p>
          <h3 className="mt-3 text-2xl font-semibold tracking-[-0.04em] text-[var(--ink-strong)]">
            Incoming purchase requests
          </h3>
        </div>
        <span className="rounded-full border border-[var(--line-soft)] bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-[var(--brand-deep)]">
          {orders.length} orders
        </span>
      </div>

      <div className="mt-5 space-y-4">
        {error ? (
          <div className="rounded-[1rem] border border-[var(--warning-line)] bg-[var(--warning-surface)] px-4 py-3 text-sm text-[var(--warning-copy)]">
            {error}
          </div>
        ) : null}
        {orders.map((order) => {
          const canCancel = order.status !== "PAID" && order.status !== "CANCELLED";

          return (
            <article key={order.id} className="rounded-[1.4rem] border border-[var(--line-soft)] bg-white/78 p-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div>
                  <p className="font-mono text-xs uppercase tracking-[0.24em] text-[var(--ink-soft)]">
                    {order.status} · {order.id}
                  </p>
                  <h4 className="mt-2 text-lg font-semibold text-[var(--ink-strong)]">
                    {order.contactFullName} · {order.contactEmail}
                  </h4>
                  <p className="mt-2 text-sm text-[var(--ink-muted)]">
                    {order.shippingRecipientName} · {order.shippingStreetLine1}
                    {order.shippingStreetLine2 ? `, ${order.shippingStreetLine2}` : ""} · {order.shippingLocality}, {order.shippingProvince}
                  </p>
                  <p className="mt-2 text-sm text-[var(--ink-muted)]">
                    CP {order.shippingPostalCode} · {order.shippingPhone}
                  </p>
                </div>
                <div className="flex flex-col items-start gap-3 md:items-end">
                  <strong className="text-lg text-[var(--ink-strong)]">
                    {formatMoney(order.totalAmount, order.currencyCode)}
                  </strong>
                  <button className="rounded-full border border-[var(--line-soft)] px-4 py-2 text-sm font-semibold disabled:opacity-50" disabled={!canCancel || pendingOrderId === order.id} onClick={() => void handleCancel(order.id)} type="button">
                    {pendingOrderId === order.id
                      ? "Cancelling..."
                      : canCancel
                        ? "Cancel order"
                        : "Order locked"}
                  </button>
                </div>
              </div>
              <div className="mt-4 rounded-[1rem] border border-[var(--line-soft)] bg-[var(--surface-panel)] p-4 text-sm text-[var(--ink-muted)]">
                {order.items.map((item) => (
                  <p key={`${order.id}-${item.variantId}`}>
                    {item.quantity} x {item.productName} / {item.variantName} ({item.sku})
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
