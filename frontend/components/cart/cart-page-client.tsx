"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useCommerce } from "@/components/commerce/commerce-provider";
import { createCheckoutPreference, createOrder } from "@/lib/commerce/api";
import { createEmptyCheckoutFormState, toCreateOrderRequest } from "@/lib/commerce/cart";
import {
  canStartCheckout,
  toCheckoutErrorMessage,
  validateCheckoutForm,
} from "@/lib/commerce/checkout";
import { formatItemCount, formatLineTotal, formatMoney } from "@/lib/commerce/format";
import { appCopy } from "@/lib/copy/es-ar";

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
  const copy = appCopy.cart;
  const [checkoutForm, setCheckoutForm] = useState(createEmptyCheckoutFormState);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isCheckoutReady = useMemo(
    () => canStartCheckout({ isSubmitting, lineCount: cartState.lines.length }),
    [cartState.lines.length, isSubmitting],
  );

  async function handleCheckout() {
    if (!isCheckoutReady) {
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
          <p className="font-mono text-xs uppercase tracking-[0.34em] text-[var(--ink-soft)]">{copy.emptyEyebrow}</p>
          <h1 className="mt-4 text-4xl font-semibold tracking-[-0.05em] text-[var(--ink-strong)]">{copy.emptyTitle}</h1>
          <p className="mt-4 text-sm leading-7 text-[var(--ink-muted)]">{copy.emptyDescription}</p>
          <Link className="mt-6 inline-flex rounded-full bg-[var(--ink-strong)] px-5 py-3 text-sm font-semibold text-[var(--surface-base)]" href="/">
            {copy.returnToCatalog}
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-7xl px-6 py-10 sm:px-8 lg:px-12">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.34em] text-[var(--ink-soft)]">{copy.eyebrow}</p>
          <h1 className="mt-3 text-4xl font-semibold tracking-[-0.05em] text-[var(--ink-strong)]">{copy.title}</h1>
        </div>
        <Link className="text-sm font-semibold text-[var(--ink-muted)]" href="/">
          {copy.continueBrowsing}
        </Link>
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        {copy.steps.map((step) => (
          <span
            key={step}
            className="rounded-full border border-[var(--line-soft)] bg-white/76 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--ink-strong)]"
          >
            {step}
          </span>
        ))}
      </div>

      <section className="grid gap-6 lg:grid-cols-[1.08fr_0.92fr]">
        <article className="rounded-[2rem] border border-[var(--line-soft)] bg-white/82 p-6 shadow-[0_18px_60px_rgba(51,38,29,0.1)]">
          <div className="flex items-center justify-between gap-4 border-b border-[var(--line-soft)] pb-4">
            <p className="font-mono text-xs uppercase tracking-[0.3em] text-[var(--ink-soft)]">{formatItemCount(itemCount)}</p>
            <button className="text-sm font-semibold text-[var(--ink-muted)]" onClick={clearCart} type="button">
              {copy.clearCart}
            </button>
          </div>
          <div className="mt-6 space-y-4">
            {cartState.lines.map((line) => (
              <article
                key={line.variantId}
                className="flex flex-col gap-4 rounded-[1.5rem] border border-[var(--line-soft)] bg-[var(--surface-panel)] p-4"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-4">
                    <div className="h-20 w-20 overflow-hidden rounded-[1.2rem] bg-[linear-gradient(160deg,rgba(210,120,55,0.24),rgba(24,80,104,0.16))]">
                      {line.imageUrl ? <img alt={line.imageAlt ?? line.productName} className="h-full w-full object-cover" src={line.imageUrl} /> : null}
                    </div>
                    <div>
                      <Link className="text-xl font-semibold tracking-[-0.03em] text-[var(--ink-strong)]" href={`/products/${line.productSlug}`}>
                        {line.productName}
                      </Link>
                      <p className="mt-2 text-sm text-[var(--ink-muted)]">{line.variantName} · {line.sku}</p>
                      <p className="mt-2 text-sm font-semibold text-[var(--ink-strong)]">{formatLineTotal(line)}</p>
                    </div>
                  </div>
                  <div className="rounded-[1rem] border border-[var(--line-soft)] bg-white/75 px-4 py-3 text-sm text-[var(--ink-muted)]">
                    <p>{copy.quantityLabel}</p>
                    <p className="mt-1 font-semibold text-[var(--ink-strong)]">{line.quantity}</p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <button className="h-10 w-10 rounded-full border border-[var(--line-soft)] bg-white" onClick={() => updateQuantity(line.variantId, line.quantity - 1)} type="button">-</button>
                  <button className="h-10 w-10 rounded-full border border-[var(--line-soft)] bg-white" onClick={() => updateQuantity(line.variantId, line.quantity + 1)} type="button">+</button>
                  <button className="rounded-full px-3 py-2 text-sm font-semibold text-[var(--ink-muted)]" onClick={() => removeLine(line.variantId)} type="button">
                    {copy.remove}
                  </button>
                </div>
              </article>
            ))}
          </div>
        </article>

        <aside className="rounded-[2rem] border border-[var(--line-soft)] bg-[linear-gradient(180deg,rgba(26,58,73,0.96),rgba(18,39,52,0.98))] p-6 text-[var(--surface-base)] shadow-[0_18px_60px_rgba(8,14,19,0.28)] lg:sticky lg:top-24 lg:self-start">
          <p className="font-mono text-xs uppercase tracking-[0.32em] text-[var(--accent-sand)]">{copy.orderSummaryEyebrow}</p>
          <h2 className="mt-4 text-3xl font-semibold tracking-[-0.04em]">{copy.orderSummaryTitle}</h2>
          <p className="mt-4 text-sm leading-7 text-white/76">{copy.orderSummaryDescription}</p>

          <div className="mt-6 rounded-[1.5rem] border border-white/10 bg-white/6 p-5">
            <div className="flex items-center justify-between gap-4">
              <span className="text-sm text-white/70">{copy.subtotal}</span>
              <strong className="text-xl">{formatMoney(subtotalAmount, currencyCode)}</strong>
            </div>

            <div className="mt-5 rounded-[1.25rem] border border-white/10 bg-black/10 p-4 text-sm text-white/76">
              <p className="font-semibold text-white">{copy.deliveryScopeTitle}</p>
              <p className="mt-2 leading-7">{copy.deliveryScopeDescription}</p>
            </div>

            <div className="mt-5 grid gap-4">
              <p className="font-mono text-xs uppercase tracking-[0.24em] text-[var(--accent-sand)]">{copy.contactSection}</p>
              <label className="block text-sm text-white/76">
                {copy.fullName}
                <input className="mt-2 w-full rounded-full border border-white/14 bg-white/10 px-4 py-3 text-sm text-white outline-none placeholder:text-white/44" onChange={(event) => setCheckoutForm((current) => ({ ...current, fullName: event.target.value }))} placeholder="Ada Buyer" value={checkoutForm.fullName} />
              </label>
              <label className="block text-sm text-white/76">
                {copy.email}
                <input className="mt-2 w-full rounded-full border border-white/14 bg-white/10 px-4 py-3 text-sm text-white outline-none placeholder:text-white/44" onChange={(event) => setCheckoutForm((current) => ({ ...current, email: event.target.value }))} placeholder="ada@example.com" type="email" value={checkoutForm.email} />
              </label>
              <label className="block text-sm text-white/76">
                {copy.phone}
                <input className="mt-2 w-full rounded-full border border-white/14 bg-white/10 px-4 py-3 text-sm text-white outline-none placeholder:text-white/44" onChange={(event) => setCheckoutForm((current) => ({ ...current, phone: event.target.value }))} placeholder="11 5555 5555" value={checkoutForm.phone} />
              </label>
            </div>

            <div className="mt-5 grid gap-4">
              <p className="font-mono text-xs uppercase tracking-[0.24em] text-[var(--accent-sand)]">{copy.shippingSection}</p>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block text-sm text-white/76">
                  {copy.recipientName}
                  <input className="mt-2 w-full rounded-full border border-white/14 bg-white/10 px-4 py-3 text-sm text-white outline-none placeholder:text-white/44" onChange={(event) => setCheckoutForm((current) => ({ ...current, recipientName: event.target.value }))} placeholder="Quien recibe el pedido" value={checkoutForm.recipientName} />
                </label>
                <label className="block text-sm text-white/76">
                  {copy.shippingPhone}
                  <input className="mt-2 w-full rounded-full border border-white/14 bg-white/10 px-4 py-3 text-sm text-white outline-none placeholder:text-white/44" onChange={(event) => setCheckoutForm((current) => ({ ...current, shippingPhone: event.target.value }))} placeholder="Contacto para la entrega" value={checkoutForm.shippingPhone} />
                </label>
              </div>
              <label className="block text-sm text-white/76">
                {copy.streetAddress}
                <input className="mt-2 w-full rounded-full border border-white/14 bg-white/10 px-4 py-3 text-sm text-white outline-none placeholder:text-white/44" onChange={(event) => setCheckoutForm((current) => ({ ...current, streetLine1: event.target.value }))} placeholder={copy.streetAddressHint} value={checkoutForm.streetLine1} />
              </label>
              <label className="block text-sm text-white/76">
                {copy.addressLine2}
                <input className="mt-2 w-full rounded-full border border-white/14 bg-white/10 px-4 py-3 text-sm text-white outline-none placeholder:text-white/44" onChange={(event) => setCheckoutForm((current) => ({ ...current, streetLine2: event.target.value }))} placeholder="Torre, piso, puerta o referencia extra" value={checkoutForm.streetLine2} />
              </label>
              <div className="grid gap-4 sm:grid-cols-3">
                <label className="block text-sm text-white/76 sm:col-span-2">
                  {copy.locality}
                  <input className="mt-2 w-full rounded-full border border-white/14 bg-white/10 px-4 py-3 text-sm text-white outline-none placeholder:text-white/44" onChange={(event) => setCheckoutForm((current) => ({ ...current, locality: event.target.value }))} placeholder="CABA, Vicente Lopez, Quilmes..." value={checkoutForm.locality} />
                </label>
                <label className="block text-sm text-white/76">
                  {copy.postalCode}
                  <input className="mt-2 w-full rounded-full border border-white/14 bg-white/10 px-4 py-3 text-sm text-white outline-none placeholder:text-white/44" onChange={(event) => setCheckoutForm((current) => ({ ...current, postalCode: event.target.value }))} placeholder="C1425" value={checkoutForm.postalCode} />
                </label>
              </div>
              <label className="block text-sm text-white/76">
                {copy.province}
                <input className="mt-2 w-full rounded-full border border-white/14 bg-white/10 px-4 py-3 text-sm text-white outline-none placeholder:text-white/44" onChange={(event) => setCheckoutForm((current) => ({ ...current, province: event.target.value }))} placeholder="CABA o Buenos Aires" value={checkoutForm.province} />
              </label>
              <label className="block text-sm text-white/76">
                {copy.deliveryNotes}
                <textarea className="mt-2 min-h-24 w-full rounded-[1.5rem] border border-white/14 bg-white/10 px-4 py-3 text-sm text-white outline-none placeholder:text-white/44" onChange={(event) => setCheckoutForm((current) => ({ ...current, deliveryNotes: event.target.value }))} placeholder="Horario, timbre o referencia de entrega" value={checkoutForm.deliveryNotes} />
              </label>
            </div>

            <p className="mt-4 text-xs uppercase tracking-[0.24em] text-white/56">{copy.ambaOnly}</p>
            {error ? <p className="mt-4 text-sm text-[var(--accent-sand)]">{error}</p> : null}
            <button className="mt-5 w-full rounded-full bg-[var(--surface-base)] px-5 py-3 text-sm font-semibold text-[var(--ink-strong)] transition-transform hover:-translate-y-0.5 disabled:translate-y-0 disabled:opacity-60" disabled={isSubmitting} onClick={() => void handleCheckout()} type="button">
              {isSubmitting ? copy.preparing : copy.continueToPayment}
            </button>
          </div>
        </aside>
      </section>
    </main>
  );
}
