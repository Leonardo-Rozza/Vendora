"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { useCommerce } from "@/components/commerce/commerce-provider";
import { resolveCheckoutReferences } from "@/lib/commerce/checkout";
import { formatItemCount, formatMoney } from "@/lib/commerce/format";
import type { CheckoutStatusRoute } from "@/lib/contracts";

const COPY_BY_STATUS: Record<
  CheckoutStatusRoute,
  {
    eyebrow: string;
    title: string;
    description: string;
    actionLabel: string;
    actionHref: string;
  }
> = {
  success: {
    eyebrow: "Payment success",
    title: "Your payment handoff finished successfully.",
    description: "Webhook confirmation remains the final backend authority, but your order has been handed off cleanly.",
    actionLabel: "Return to catalog",
    actionHref: "/",
  },
  pending: {
    eyebrow: "Payment pending",
    title: "Mercado Pago is still confirming the payment.",
    description: "Keep the order reference nearby while the backend waits for the provider webhook to settle the payment state.",
    actionLabel: "Review cart",
    actionHref: "/cart",
  },
  failure: {
    eyebrow: "Payment failure",
    title: "The payment did not complete.",
    description: "You can return to the cart or browse the catalog again before retrying checkout.",
    actionLabel: "Back to cart",
    actionHref: "/cart",
  },
};

export function CheckoutStatusClient({ status }: { status: CheckoutStatusRoute }) {
  const searchParams = useSearchParams();
  const { cartState, clearCart } = useCommerce();
  const content = COPY_BY_STATUS[status];
  const { orderReference, paymentReference } = resolveCheckoutReferences({
    searchParams,
    snapshot: cartState.lastCheckout,
  });

  useEffect(() => {
    if (status === "success") {
      clearCart();
    }
  }, [clearCart, status]);

  return (
    <main className="mx-auto w-full max-w-4xl px-6 py-12 sm:px-8 lg:px-12">
      <section className="rounded-[2rem] border border-[var(--line-soft)] bg-white/80 p-8 shadow-[0_20px_70px_rgba(61,43,28,0.08)]">
        <p className="font-mono text-xs uppercase tracking-[0.34em] text-[var(--ink-soft)]">
          {content.eyebrow}
        </p>
        <h1 className="mt-4 text-4xl font-semibold tracking-[-0.05em] text-[var(--ink-strong)]">
          {content.title}
        </h1>
        <p className="mt-4 text-sm leading-7 text-[var(--ink-muted)]">{content.description}</p>

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <div className="rounded-[1.5rem] border border-[var(--line-soft)] bg-[var(--surface-panel)] p-5">
            <p className="font-mono text-xs uppercase tracking-[0.28em] text-[var(--brand-deep)]">
              Order reference
            </p>
            <p className="mt-3 text-lg font-semibold text-[var(--ink-strong)]">
              {orderReference ?? "Available after redirect metadata arrives"}
            </p>
          </div>
          <div className="rounded-[1.5rem] border border-[var(--line-soft)] bg-[var(--surface-panel)] p-5">
            <p className="font-mono text-xs uppercase tracking-[0.28em] text-[var(--brand-deep)]">
              Payment reference
            </p>
            <p className="mt-3 text-lg font-semibold text-[var(--ink-strong)]">
              {paymentReference ?? "Not provided in the redirect"}
            </p>
          </div>
        </div>

        {cartState.lastCheckout ? (
          <div className="mt-4 rounded-[1.5rem] border border-[var(--line-soft)] bg-[var(--surface-panel)] p-5 text-sm text-[var(--ink-muted)]">
            Last checkout snapshot: {formatItemCount(cartState.lastCheckout.itemCount)} · {formatMoney(cartState.lastCheckout.totalAmount, cartState.lastCheckout.currencyCode)}
          </div>
        ) : null}

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link className="rounded-full bg-[var(--ink-strong)] px-5 py-3 text-sm font-semibold text-[var(--surface-base)]" href={content.actionHref}>
            {content.actionLabel}
          </Link>
          <Link className="rounded-full border border-[var(--line-strong)] px-5 py-3 text-sm font-semibold text-[var(--ink-strong)]" href="/">
            Browse catalog
          </Link>
        </div>
      </section>
    </main>
  );
}
