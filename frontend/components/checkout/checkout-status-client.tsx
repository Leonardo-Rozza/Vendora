"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { useCommerce } from "@/components/commerce/commerce-provider";
import {
  resolveCheckoutReferences,
  resolveTrackingPath,
} from "@/lib/commerce/checkout";
import { formatItemCount, formatMoney } from "@/lib/commerce/format";
import type { CheckoutStatusRoute } from "@/lib/contracts";
import { appCopy } from "@/lib/copy/es-ar";

type StatusVisual = {
  icon: string;
  iconClassName: string;
};

const STATUS_VISUALS: Record<CheckoutStatusRoute, StatusVisual> = {
  success: {
    icon: "✓",
    iconClassName: "bg-success-surface text-success-ink",
  },
  pending: {
    icon: "⏳",
    iconClassName: "bg-warning-surface text-warning-line",
  },
  failure: {
    icon: "×",
    iconClassName: "bg-danger-surface text-danger-ink",
  },
};

export function CheckoutStatusClient({
  status,
}: {
  status: CheckoutStatusRoute;
}) {
  const searchParams = useSearchParams();
  const { cartState, clearCart } = useCommerce();
  const content = appCopy.checkoutStatus[status];
  const copy = appCopy.checkoutStatus;
  const { orderReference, paymentReference } = resolveCheckoutReferences({
    searchParams,
    snapshot: cartState.lastCheckout,
  });
  const trackingPath = resolveTrackingPath(cartState.lastCheckout);
  const visual = STATUS_VISUALS[status];

  useEffect(() => {
    if (status === "success") {
      clearCart();
    }
  }, [clearCart, status]);

  return (
    <main className="mx-auto w-full max-w-[620px] px-5 py-12 sm:py-16">
      <section className="animate-vd-pop rounded-[22px] border border-line-soft bg-surface-panel px-8 py-11 text-center shadow-soft">
        <div
          className={`mx-auto grid h-[76px] w-[76px] place-items-center rounded-full text-[38px] font-extrabold ${visual.iconClassName}`}
          aria-hidden="true"
        >
          {visual.icon}
        </div>

        <p className="mt-6 font-mono text-[11px] uppercase tracking-[0.16em] text-ink-soft">
          {copy.orderReference}: {orderReference ?? copy.fallbackOrder}
        </p>
        <h1 className="mt-2 text-[28px] font-extrabold tracking-[-0.02em] text-ink-strong">
          {content.title}
        </h1>
        <p className="mx-auto mt-3 max-w-[42ch] text-[15.5px] leading-relaxed text-ink-muted">
          {content.description}
        </p>

        <div className="mt-7 rounded-[14px] bg-surface-sand px-5 py-4 text-left">
          <div className="flex items-baseline justify-between gap-3.5 text-sm">
            <span className="whitespace-nowrap text-ink-muted">
              {copy.paymentReference}
            </span>
            <span className="whitespace-nowrap font-bold text-ink-strong">
              {paymentReference ?? copy.fallbackPayment}
            </span>
          </div>
          {cartState.lastCheckout ? (
            <div className="mt-2.5 flex items-baseline justify-between gap-3.5 text-sm">
              <span className="whitespace-nowrap text-ink-muted">
                {copy.snapshotLabel}
              </span>
              <span className="text-right font-semibold text-ink-strong">
                {formatItemCount(cartState.lastCheckout.itemCount)} ·{" "}
                {formatMoney(
                  cartState.lastCheckout.totalAmount,
                  cartState.lastCheckout.currencyCode,
                )}
              </span>
            </div>
          ) : null}
        </div>

        <div className="mt-6 rounded-[14px] border border-line-soft bg-surface-base px-5 py-4 text-left">
          <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-brand-deep">
            {copy.trackingCardTitle}
          </p>
          <p className="mt-2 text-sm leading-relaxed text-ink-muted">
            {copy.trackingCardDescription}
          </p>
          <p className="mt-2 text-xs text-ink-soft">
            {trackingPath ? trackingPath : copy.trackingPendingHint}
          </p>
        </div>

        <div className="mt-7 flex flex-wrap justify-center gap-3">
          <Link
            className="inline-flex items-center justify-center gap-2 rounded-field bg-brand-deep px-6 py-3 text-[15px] font-bold text-surface-base transition-colors duration-150 hover:bg-brand-hover focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-accent-sand"
            href={trackingPath ?? content.actionHref}
          >
            {trackingPath ? copy.trackingButton : content.actionLabel}
          </Link>
          <Link
            className="inline-flex items-center justify-center gap-2 rounded-field border-2 border-line-strong bg-surface-panel px-6 py-3 text-[15px] font-bold text-brand-deep transition-colors duration-150 hover:border-brand-deep hover:bg-surface-base focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-accent-sand"
            href="/"
          >
            {copy.browseCatalog}
          </Link>
        </div>
      </section>
    </main>
  );
}
