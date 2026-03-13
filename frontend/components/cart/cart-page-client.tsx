"use client";

import Link from "next/link";
import { useState } from "react";
import { useCommerce } from "@/components/commerce/commerce-provider";
import { createCheckoutPreference, createOrder } from "@/lib/commerce/api";
import { createEmptyCheckoutFormState, toCreateOrderRequest } from "@/lib/commerce/cart";
import {
  canStartCheckout,
  toCheckoutErrorMessage,
  validateCheckoutForm,
} from "@/lib/commerce/checkout";
import { formatItemCount, formatLineTotal, formatMoney } from "@/lib/commerce/format";

export function CartPageClient() {
  const {
    cartState,
    clearCart,
    currencyCode,
    hasHydrated,
    itemCount,
    removeLine,
    setLastCheckout,
    subtotalAmount,
    updateQuantity,
  } = useCommerce();
  const [checkoutForm, setCheckoutForm] = useState(createEmptyCheckoutFormState);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCheckout() {
    if (!canStartCheckout({ isSubmitting, lineCount: cartState.lines.length })) {
      return;
    }

    const validationMessage = validateCheckoutForm(checkoutForm);

    if (validationMessage) {
      setError(validationMessage);
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const order = await createOrder(toCreateOrderRequest(cartState, checkoutForm));
      const preference = await createCheckoutPreference({
        orderId: order.id,
        payerEmail: checkoutForm.email.trim() || undefined,
      });

      setLastCheckout({
        orderId: order.id,
        paymentId: preference.paymentId,
        preferenceId: preference.preferenceId,
        itemCount,
        totalAmount: order.totalAmount,
        currencyCode: order.currencyCode,
        submittedAt: new Date().toISOString(),
      });

      window.location.assign(preference.initPoint);
    } catch (caughtError) {
      setError(toCheckoutErrorMessage(caughtError));
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!hasHydrated) {
    return (
      <main className="mx-auto w-full max-w-7xl px-6 py-10 sm:px-8 lg:px-12">
        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="min-h-[18rem] animate-pulse rounded-[2rem] bg-white/70" />
          <div className="min-h-[18rem] animate-pulse rounded-[2rem] bg-white/70" />
        </div>
      </main>
    );
  }

  if (cartState.lines.length === 0) {
    return (
      <main className="mx-auto w-full max-w-4xl px-6 py-12 sm:px-8 lg:px-12">
        <div className="rounded-[2rem] border border-[var(--line-soft)] bg-white/78 p-8 shadow-[0_20px_70px_rgba(61,43,28,0.08)]">
          <p className="font-mono text-xs uppercase tracking-[0.34em] text-[var(--ink-soft)]">
            Cart destination
          </p>
          <h1 className="mt-4 text-4xl font-semibold tracking-[-0.05em] text-[var(--ink-strong)]">
            Your cart is empty.
          </h1>
          <p className="mt-4 text-sm leading-7 text-[var(--ink-muted)]">
            Browse the active catalog and add a variant before starting checkout.
          </p>
          <Link
            className="mt-6 inline-flex rounded-full bg-[var(--ink-strong)] px-5 py-3 text-sm font-semibold text-[var(--surface-base)]"
            href="/"
          >
            Return to catalog
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-7xl px-6 py-10 sm:px-8 lg:px-12">
      <div className="mb-8 flex items-center justify-between gap-4">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.34em] text-[var(--ink-soft)]">
            Cart destination
          </p>
          <h1 className="mt-3 text-4xl font-semibold tracking-[-0.05em] text-[var(--ink-strong)]">
            Review, adjust, and hand off to Mercado Pago.
          </h1>
        </div>
        <Link className="text-sm font-semibold text-[var(--ink-muted)]" href="/">
          Continue browsing
        </Link>
      </div>

      <section className="grid gap-6 lg:grid-cols-[1.16fr_0.84fr]">
        <article className="rounded-[2rem] border border-[var(--line-soft)] bg-white/82 p-6 shadow-[0_18px_60px_rgba(51,38,29,0.1)]">
          <div className="flex items-center justify-between gap-4 border-b border-[var(--line-soft)] pb-4">
            <p className="font-mono text-xs uppercase tracking-[0.3em] text-[var(--ink-soft)]">
              {formatItemCount(itemCount)}
            </p>
            <button className="text-sm font-semibold text-[var(--ink-muted)]" onClick={clearCart} type="button">
              Clear cart
            </button>
          </div>
          <div className="mt-6 space-y-4">
            {cartState.lines.map((line) => (
              <article
                key={line.variantId}
                className="flex flex-col gap-4 rounded-[1.5rem] border border-[var(--line-soft)] bg-[var(--surface-panel)] p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex items-center gap-4">
                  <div className="h-20 w-20 overflow-hidden rounded-[1.2rem] bg-[linear-gradient(160deg,rgba(210,120,55,0.24),rgba(24,80,104,0.16))]">
                    {line.imageUrl ? (
                      <img alt={line.imageAlt ?? line.productName} className="h-full w-full object-cover" src={line.imageUrl} />
                    ) : null}
                  </div>
                  <div>
                    <Link className="text-xl font-semibold tracking-[-0.03em] text-[var(--ink-strong)]" href={`/products/${line.productSlug}`}>
                      {line.productName}
                    </Link>
                    <p className="mt-2 text-sm text-[var(--ink-muted)]">
                      {line.variantName} · {line.sku}
                    </p>
                    <p className="mt-2 text-sm font-semibold text-[var(--ink-strong)]">
                      {formatLineTotal(line)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <button className="h-10 w-10 rounded-full border border-[var(--line-soft)]" onClick={() => updateQuantity(line.variantId, line.quantity - 1)} type="button">
                    -
                  </button>
                  <span className="min-w-10 text-center text-sm font-semibold text-[var(--ink-strong)]">
                    {line.quantity}
                  </span>
                  <button className="h-10 w-10 rounded-full border border-[var(--line-soft)]" onClick={() => updateQuantity(line.variantId, line.quantity + 1)} type="button">
                    +
                  </button>
                  <button className="rounded-full px-3 py-2 text-sm font-semibold text-[var(--ink-muted)]" onClick={() => removeLine(line.variantId)} type="button">
                    Remove
                  </button>
                </div>
              </article>
            ))}
          </div>
        </article>

        <aside className="rounded-[2rem] border border-[var(--line-soft)] bg-[linear-gradient(180deg,rgba(26,58,73,0.96),rgba(18,39,52,0.98))] p-6 text-[var(--surface-base)] shadow-[0_18px_60px_rgba(8,14,19,0.28)]">
          <p className="font-mono text-xs uppercase tracking-[0.32em] text-[var(--accent-sand)]">
            Checkout initiation
          </p>
          <h2 className="mt-4 text-3xl font-semibold tracking-[-0.04em]">
            Prepare the order before leaving for Mercado Pago.
          </h2>
          <p className="mt-4 text-sm leading-7 text-white/76">
            Vendora creates the order first, then requests the checkout preference.
            Contact and shipping data are captured before redirect, and shipping is currently limited to AMBA.
          </p>

          <div className="mt-6 rounded-[1.5rem] border border-white/10 bg-white/6 p-5">
            <div className="flex items-center justify-between gap-4">
              <span className="text-sm text-white/70">Subtotal</span>
              <strong className="text-xl">{formatMoney(subtotalAmount, currencyCode)}</strong>
            </div>
            <div className="mt-5 grid gap-4">
              <label className="block text-sm text-white/76">
                Contact full name
                <input
                  className="mt-2 w-full rounded-full border border-white/14 bg-white/10 px-4 py-3 text-sm text-white outline-none placeholder:text-white/44"
                  onChange={(event) => setCheckoutForm((current) => ({ ...current, fullName: event.target.value }))}
                  placeholder="Buyer full name"
                  value={checkoutForm.fullName}
                />
              </label>
              <label className="block text-sm text-white/76">
                Contact email
                <input
                  className="mt-2 w-full rounded-full border border-white/14 bg-white/10 px-4 py-3 text-sm text-white outline-none placeholder:text-white/44"
                  onChange={(event) => setCheckoutForm((current) => ({ ...current, email: event.target.value }))}
                  placeholder="buyer@example.com"
                  type="email"
                  value={checkoutForm.email}
                />
              </label>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block text-sm text-white/76">
                  Contact phone
                  <input
                    className="mt-2 w-full rounded-full border border-white/14 bg-white/10 px-4 py-3 text-sm text-white outline-none placeholder:text-white/44"
                    onChange={(event) => setCheckoutForm((current) => ({ ...current, phone: event.target.value }))}
                    placeholder="11 5555 5555"
                    value={checkoutForm.phone}
                  />
                </label>
                <label className="block text-sm text-white/76">
                  Recipient name
                  <input
                    className="mt-2 w-full rounded-full border border-white/14 bg-white/10 px-4 py-3 text-sm text-white outline-none placeholder:text-white/44"
                    onChange={(event) => setCheckoutForm((current) => ({ ...current, recipientName: event.target.value }))}
                    placeholder="Who receives the order"
                    value={checkoutForm.recipientName}
                  />
                </label>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block text-sm text-white/76">
                  Shipping phone
                  <input
                    className="mt-2 w-full rounded-full border border-white/14 bg-white/10 px-4 py-3 text-sm text-white outline-none placeholder:text-white/44"
                    onChange={(event) => setCheckoutForm((current) => ({ ...current, shippingPhone: event.target.value }))}
                    placeholder="Delivery contact"
                    value={checkoutForm.shippingPhone}
                  />
                </label>
                <label className="block text-sm text-white/76">
                  Postal code
                  <input
                    className="mt-2 w-full rounded-full border border-white/14 bg-white/10 px-4 py-3 text-sm text-white outline-none placeholder:text-white/44"
                    onChange={(event) => setCheckoutForm((current) => ({ ...current, postalCode: event.target.value }))}
                    placeholder="C1425 / B1678"
                    value={checkoutForm.postalCode}
                  />
                </label>
              </div>
              <label className="block text-sm text-white/76">
                Street address
                <input
                  className="mt-2 w-full rounded-full border border-white/14 bg-white/10 px-4 py-3 text-sm text-white outline-none placeholder:text-white/44"
                  onChange={(event) => setCheckoutForm((current) => ({ ...current, streetLine1: event.target.value }))}
                  placeholder="Street, number, floor, apartment"
                  value={checkoutForm.streetLine1}
                />
              </label>
              <label className="block text-sm text-white/76">
                Address line 2 (optional)
                <input
                  className="mt-2 w-full rounded-full border border-white/14 bg-white/10 px-4 py-3 text-sm text-white outline-none placeholder:text-white/44"
                  onChange={(event) => setCheckoutForm((current) => ({ ...current, streetLine2: event.target.value }))}
                  placeholder="Tower, block, extra reference"
                  value={checkoutForm.streetLine2}
                />
              </label>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block text-sm text-white/76">
                  Locality
                  <input
                    className="mt-2 w-full rounded-full border border-white/14 bg-white/10 px-4 py-3 text-sm text-white outline-none placeholder:text-white/44"
                    onChange={(event) => setCheckoutForm((current) => ({ ...current, locality: event.target.value }))}
                    placeholder="CABA, Vicente Lopez, Quilmes..."
                    value={checkoutForm.locality}
                  />
                </label>
                <label className="block text-sm text-white/76">
                  Province
                  <input
                    className="mt-2 w-full rounded-full border border-white/14 bg-white/10 px-4 py-3 text-sm text-white outline-none placeholder:text-white/44"
                    onChange={(event) => setCheckoutForm((current) => ({ ...current, province: event.target.value }))}
                    placeholder="CABA or Buenos Aires"
                    value={checkoutForm.province}
                  />
                </label>
              </div>
              <label className="block text-sm text-white/76">
                Delivery notes (optional)
                <textarea
                  className="mt-2 min-h-24 w-full rounded-[1.5rem] border border-white/14 bg-white/10 px-4 py-3 text-sm text-white outline-none placeholder:text-white/44"
                  onChange={(event) => setCheckoutForm((current) => ({ ...current, deliveryNotes: event.target.value }))}
                  placeholder="Preferred time slot, doorbell instructions, or extra reference"
                  value={checkoutForm.deliveryNotes}
                />
              </label>
            </div>
            <p className="mt-4 text-xs uppercase tracking-[0.24em] text-white/56">
              Shipping scope: AMBA only for this MVP batch.
            </p>
            {error ? <p className="mt-4 text-sm text-[var(--accent-sand)]">{error}</p> : null}
            <button
              className="mt-5 w-full rounded-full bg-[var(--surface-base)] px-5 py-3 text-sm font-semibold text-[var(--ink-strong)] transition-transform hover:-translate-y-0.5 disabled:translate-y-0 disabled:opacity-60"
              disabled={isSubmitting}
              onClick={() => void handleCheckout()}
              type="button"
            >
              {isSubmitting ? "Preparing checkout..." : "Continue to Mercado Pago"}
            </button>
          </div>
        </aside>
      </section>
    </main>
  );
}
