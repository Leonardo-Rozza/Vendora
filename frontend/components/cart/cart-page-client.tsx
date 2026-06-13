"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useCommerce } from "@/components/commerce/commerce-provider";
import { CheckoutForm } from "@/components/cart/checkout-form";
import {
  CouponForm,
  type AppliedCoupon,
} from "@/components/cart/coupon-form";
import {
  checkCartAvailability,
  createCheckoutPreference,
  createOrder,
  validateCoupon,
} from "@/lib/commerce/api";
import type { CartAvailabilityLine } from "@/lib/contracts";
import {
  createEmptyCheckoutFormState,
  toCreateOrderRequest,
} from "@/lib/commerce/cart";
import {
  canStartCheckout,
  toCheckoutErrorMessage,
  validateCheckoutForm,
} from "@/lib/commerce/checkout";
import {
  formatItemCount,
  formatLineTotal,
  formatMoney,
} from "@/lib/commerce/format";
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
  const [checkoutForm, setCheckoutForm] = useState(
    createEmptyCheckoutFormState,
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [appliedCoupon, setAppliedCoupon] = useState<AppliedCoupon | null>(
    null,
  );
  const [couponError, setCouponError] = useState<string | null>(null);
  const [isValidatingCoupon, setIsValidatingCoupon] = useState(false);
  const [availabilityByVariant, setAvailabilityByVariant] = useState<
    Record<string, CartAvailabilityLine>
  >({});

  // Stable key over the current lines (variantId + quantity) so the
  // availability effect only re-fetches when lines or quantities change,
  // never on every render.
  const availabilityKey = useMemo(
    () =>
      cartState.lines
        .map((line) => `${line.variantId}:${line.quantity}`)
        .join("|"),
    [cartState.lines],
  );

  useEffect(() => {
    if (cartState.lines.length === 0) {
      setAvailabilityByVariant({});
      return;
    }

    let cancelled = false;
    const items = cartState.lines.map((line) => ({
      variantId: line.variantId,
      quantity: line.quantity,
    }));

    void checkCartAvailability(items)
      .then((lines) => {
        if (cancelled) {
          return;
        }

        setAvailabilityByVariant(
          Object.fromEntries(lines.map((line) => [line.variantId, line])),
        );
      })
      .catch((caughtError) => {
        // Best-effort: a failed availability check must never block checkout.
        console.error("No pudimos verificar el stock en vivo", caughtError);
        if (!cancelled) {
          setAvailabilityByVariant({});
        }
      });

    return () => {
      cancelled = true;
    };
    // availabilityKey captures variantId + quantity changes for every line.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [availabilityKey]);

  const unavailableLines = useMemo(
    () =>
      cartState.lines.filter(
        (line) => availabilityByVariant[line.variantId]?.available === false,
      ),
    [availabilityByVariant, cartState.lines],
  );
  const hasUnavailableLines = unavailableLines.length > 0;

  const isCheckoutReady = useMemo(
    () => canStartCheckout({ isSubmitting, lineCount: cartState.lines.length }),
    [cartState.lines.length, isSubmitting],
  );

  const discountAmount = appliedCoupon
    ? Math.min(Number(appliedCoupon.discountAmount), Number(subtotalAmount))
    : 0;
  const totalAmount = Math.max(Number(subtotalAmount) - discountAmount, 0);

  // Drop the applied coupon if the cart becomes empty.
  useEffect(() => {
    if (cartState.lines.length === 0 && appliedCoupon) {
      setAppliedCoupon(null);
      setCouponError(null);
    }
  }, [appliedCoupon, cartState.lines.length]);

  async function handleApplyCoupon(code: string) {
    setIsValidatingCoupon(true);
    setCouponError(null);

    try {
      const evaluation = await validateCoupon(code, subtotalAmount);

      if (evaluation.valid) {
        setAppliedCoupon({
          code: evaluation.code,
          discountAmount: evaluation.discountAmount,
        });
        setCouponError(null);
      } else {
        setAppliedCoupon(null);
        setCouponError(evaluation.reason);
      }
    } catch (caughtError) {
      setAppliedCoupon(null);
      setCouponError(toCheckoutErrorMessage(caughtError));
    } finally {
      setIsValidatingCoupon(false);
    }
  }

  function handleRemoveCoupon() {
    setAppliedCoupon(null);
    setCouponError(null);
  }

  async function handleCheckout() {
    if (!isCheckoutReady || hasUnavailableLines) {
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
      const order = await createOrder(
        toCreateOrderRequest(cartState, checkoutForm, appliedCoupon?.code),
      );
      const preference = await createCheckoutPreference({
        orderId: order.id,
        payerEmail: checkoutForm.email.trim() || undefined,
      });

      setLastCheckout({
        orderId: order.id,
        paymentId: preference.paymentId,
        preferenceId: preference.preferenceId,
        trackingToken: order.trackingToken ?? undefined,
        trackingCode: order.trackingCode ?? undefined,
        trackingUrlPath: order.trackingUrlPath ?? undefined,
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
            {copy.emptyEyebrow}
          </p>
          <h1 className="mt-4 text-4xl font-semibold tracking-[-0.05em] text-[var(--ink-strong)]">
            {copy.emptyTitle}
          </h1>
          <p className="mt-4 text-sm leading-7 text-[var(--ink-muted)]">
            {copy.emptyDescription}
          </p>
          <Link
            className="mt-6 inline-flex rounded-full bg-[var(--ink-strong)] px-5 py-3 text-sm font-semibold text-[var(--surface-base)]"
            href="/"
          >
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
          <p className="font-mono text-xs uppercase tracking-[0.34em] text-[var(--ink-soft)]">
            {copy.eyebrow}
          </p>
          <h1 className="mt-3 text-4xl font-semibold tracking-[-0.05em] text-[var(--ink-strong)]">
            {copy.title}
          </h1>
        </div>
        <Link
          className="text-sm font-semibold text-[var(--ink-muted)]"
          href="/"
        >
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
            <p className="font-mono text-xs uppercase tracking-[0.3em] text-[var(--ink-soft)]">
              {formatItemCount(itemCount)}
            </p>
            <button
              className="text-sm font-semibold text-[var(--ink-muted)]"
              onClick={clearCart}
              type="button"
            >
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
                      {line.imageUrl ? (
                        <img
                          alt={line.imageAlt ?? line.productName}
                          className="h-full w-full object-cover"
                          src={line.imageUrl}
                        />
                      ) : null}
                    </div>
                    <div>
                      <Link
                        className="text-xl font-semibold tracking-[-0.03em] text-[var(--ink-strong)]"
                        href={`/products/${line.productSlug}`}
                      >
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
                  <div className="rounded-[1rem] border border-[var(--line-soft)] bg-white/75 px-4 py-3 text-sm text-[var(--ink-muted)]">
                    <p>{copy.quantityLabel}</p>
                    <p className="mt-1 font-semibold text-[var(--ink-strong)]">
                      {line.quantity}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <button
                    className="h-10 w-10 rounded-full border border-[var(--line-soft)] bg-white"
                    onClick={() =>
                      updateQuantity(line.variantId, line.quantity - 1)
                    }
                    type="button"
                  >
                    -
                  </button>
                  <button
                    className="h-10 w-10 rounded-full border border-[var(--line-soft)] bg-white"
                    onClick={() =>
                      updateQuantity(line.variantId, line.quantity + 1)
                    }
                    type="button"
                  >
                    +
                  </button>
                  <button
                    className="rounded-full px-3 py-2 text-sm font-semibold text-[var(--ink-muted)]"
                    onClick={() => removeLine(line.variantId)}
                    type="button"
                  >
                    {copy.remove}
                  </button>
                </div>

                {availabilityByVariant[line.variantId]?.available === false ? (
                  <p
                    className="rounded-[1rem] border border-[var(--accent-coral,#c2410c)] bg-[rgba(194,65,12,0.08)] px-4 py-3 text-sm font-semibold text-[var(--accent-coral,#c2410c)]"
                    role="alert"
                  >
                    Sin stock suficiente — quedan{" "}
                    {availabilityByVariant[line.variantId]!.availableQuantity}{" "}
                    disponibles
                  </p>
                ) : null}
              </article>
            ))}
          </div>
        </article>

        <aside className="rounded-[2rem] border border-[var(--line-soft)] bg-[linear-gradient(180deg,rgba(26,58,73,0.96),rgba(18,39,52,0.98))] p-6 text-[var(--surface-base)] shadow-[0_18px_60px_rgba(8,14,19,0.28)] lg:sticky lg:top-24 lg:self-start">
          <p className="font-mono text-xs uppercase tracking-[0.32em] text-[var(--accent-sand)]">
            {copy.orderSummaryEyebrow}
          </p>
          <h2 className="mt-4 text-3xl font-semibold tracking-[-0.04em]">
            {copy.orderSummaryTitle}
          </h2>
          <p className="mt-4 text-sm leading-7 text-white/76">
            {copy.orderSummaryDescription}
          </p>

          <div className="mt-6 rounded-[1.5rem] border border-white/10 bg-white/6 p-5">
            <div className="flex items-center justify-between gap-4">
              <span className="text-sm text-white/70">{copy.subtotal}</span>
              <strong className="text-xl">
                {formatMoney(subtotalAmount, currencyCode)}
              </strong>
            </div>

            {appliedCoupon ? (
              <div className="mt-3 flex items-center justify-between gap-4">
                <span className="text-sm text-white/70">
                  {copy.discount} · {appliedCoupon.code}
                </span>
                <strong className="text-xl text-[var(--accent-sand)]">
                  -{formatMoney(discountAmount, currencyCode)}
                </strong>
              </div>
            ) : null}

            <div className="mt-3 flex items-center justify-between gap-4 border-t border-white/10 pt-3">
              <span className="text-sm font-semibold text-white">
                {copy.total}
              </span>
              <strong className="text-2xl">
                {formatMoney(totalAmount, currencyCode)}
              </strong>
            </div>

            <CouponForm
              applied={appliedCoupon}
              copy={copy}
              error={couponError}
              isValidating={isValidatingCoupon}
              onApply={(code) => void handleApplyCoupon(code)}
              onRemove={handleRemoveCoupon}
            />

            <div className="mt-5 rounded-[1.25rem] border border-white/10 bg-black/10 p-4 text-sm text-white/76">
              <p className="font-semibold text-white">
                {copy.deliveryScopeTitle}
              </p>
              <p className="mt-2 leading-7">{copy.deliveryScopeDescription}</p>
            </div>

            {hasUnavailableLines ? (
              <p
                className="mt-5 rounded-[1.25rem] border border-[var(--accent-sand)] bg-black/20 p-4 text-sm font-semibold text-[var(--accent-sand)]"
                role="alert"
              >
                Hay productos sin stock suficiente en tu carrito. Ajustá las
                cantidades para continuar con el pago.
              </p>
            ) : null}

            <CheckoutForm
              copy={copy}
              disabled={hasUnavailableLines}
              error={error}
              isSubmitting={isSubmitting}
              onChange={setCheckoutForm}
              onSubmit={() => void handleCheckout()}
              value={checkoutForm}
            />
          </div>
        </aside>
      </section>
    </main>
  );
}
