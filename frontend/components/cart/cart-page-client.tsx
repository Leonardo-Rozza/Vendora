"use client";

import Image from "next/image";
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
      <main className="mx-auto w-full max-w-[1140px] px-5 pt-7 pb-20">
        <div className="flex flex-wrap items-start gap-7">
          <div className="min-h-[18rem] min-w-[300px] flex-[2] animate-pulse rounded-card bg-surface-panel/70" />
          <div className="min-h-[18rem] min-w-[280px] flex-1 animate-pulse rounded-panel bg-surface-panel/70" />
        </div>
      </main>
    );
  }

  if (cartState.lines.length === 0) {
    return (
      <main className="mx-auto w-full max-w-[1140px] px-5 pt-7 pb-20">
        <h1 className="text-[clamp(26px,4vw,34px)] font-extrabold tracking-[-0.025em] text-ink-strong">
          {copy.emptyTitle}
        </h1>
        <p className="mt-1 mb-7 text-[14.5px] text-ink-soft">{copy.emptyEyebrow}</p>
        <div className="rounded-panel border border-line-soft bg-surface-panel px-6 py-16 text-center">
          <div className="mx-auto mb-[18px] grid size-16 place-items-center rounded-card bg-surface-sand text-[28px]">
            🛒
          </div>
          <div className="text-xl font-extrabold text-ink-strong">
            {copy.emptyTitle}
          </div>
          <p className="mx-auto mt-[9px] mb-[22px] max-w-[34ch] text-[14.5px] leading-[1.55] text-ink-muted">
            {copy.emptyDescription}
          </p>
          <Link
            className="inline-flex rounded-[12px] bg-brand-deep px-[26px] py-[13px] text-[15px] font-bold text-surface-base transition-colors hover:bg-brand-hover"
            href="/"
          >
            {copy.returnToCatalog}
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-[1140px] px-5 pt-7 pb-20">
      <div className="mb-[26px] flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-[clamp(26px,4vw,34px)] font-extrabold tracking-[-0.025em] text-ink-strong">
            {copy.title}
          </h1>
          <p className="mt-1 text-[14.5px] text-ink-soft">
            {formatItemCount(itemCount)}
          </p>
        </div>
        <Link
          className="text-[14.5px] font-bold text-brand-deep"
          href="/"
        >
          ← {copy.continueBrowsing}
        </Link>
      </div>

      <div className="flex flex-wrap items-start gap-7">
        {/* LINES */}
        <div className="flex min-w-[300px] flex-[2] flex-col gap-[14px]">
          <div className="flex items-center justify-between gap-4 pb-1">
            <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink-soft">
              {formatItemCount(itemCount)}
            </p>
            <button
              className="text-sm font-bold text-ink-muted transition-colors hover:text-danger-ink"
              onClick={clearCart}
              type="button"
            >
              {copy.clearCart}
            </button>
          </div>

          {cartState.lines.map((line) => {
            const availability = availabilityByVariant[line.variantId];
            const isOverStock = availability?.available === false;

            return (
              <article
                key={line.variantId}
                className="rounded-card border border-line-soft bg-surface-panel p-4"
              >
                <div className="flex gap-4">
                  <div className="grid size-[92px] flex-shrink-0 place-items-center overflow-hidden rounded-[12px] bg-[repeating-linear-gradient(45deg,#F4EDE0,#F4EDE0_8px,#EFE6D6_8px,#EFE6D6_16px)]">
                    {line.imageUrl ? (
                      <Image
                        alt={line.imageAlt ?? line.productName}
                        className="h-full w-full object-cover"
                        height={92}
                        sizes="92px"
                        src={line.imageUrl}
                        width={92}
                      />
                    ) : null}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex justify-between gap-3">
                      <div className="min-w-0">
                        <div className="font-mono text-[10px] uppercase tracking-[0.12em] text-brand-deep">
                          {line.sku}
                        </div>
                        <Link
                          className="mt-1 block text-[15.5px] font-bold leading-[1.25] tracking-[-0.01em] text-ink-strong"
                          href={`/products/${line.productSlug}`}
                        >
                          {line.productName}
                        </Link>
                        <div className="mt-[3px] text-[13px] text-ink-soft">
                          {line.variantName}
                        </div>
                      </div>
                      <button
                        aria-label={copy.remove}
                        className="self-start text-[20px] leading-none text-ink-faint transition-colors hover:text-danger-ink"
                        onClick={() => removeLine(line.variantId)}
                        type="button"
                      >
                        ×
                      </button>
                    </div>

                    {isOverStock ? (
                      <div
                        className="my-[10px] mb-1 flex items-center gap-[7px] rounded-[8px] bg-danger-surface px-[10px] py-[6px] text-[12.5px] font-semibold text-danger-ink"
                        role="alert"
                      >
                        <span className="grid size-[15px] flex-shrink-0 place-items-center rounded-full bg-danger-ink text-[10px] text-white">
                          !
                        </span>
                        Solo quedan {availability!.availableQuantity} unidades.
                        Ajustá la cantidad.
                      </div>
                    ) : null}

                    <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center overflow-hidden rounded-[10px] border-[1.5px] border-line-strong bg-surface-panel">
                        <button
                          aria-label="Restar"
                          className="h-10 w-[38px] text-[19px] leading-none text-brand-deep"
                          onClick={() =>
                            updateQuantity(line.variantId, line.quantity - 1)
                          }
                          type="button"
                        >
                          –
                        </button>
                        <span className="min-w-[34px] text-center text-[15px] font-bold text-ink-strong">
                          {line.quantity}
                        </span>
                        <button
                          aria-label="Sumar"
                          className="h-10 w-[38px] text-[19px] leading-none text-brand-deep"
                          onClick={() =>
                            updateQuantity(line.variantId, line.quantity + 1)
                          }
                          type="button"
                        >
                          +
                        </button>
                      </div>
                      <div className="text-right">
                        <div className="whitespace-nowrap text-[17px] font-extrabold text-ink-strong">
                          {formatLineTotal(line)}
                        </div>
                        <div className="whitespace-nowrap text-[12px] text-ink-soft">
                          {formatMoney(line.unitPriceAmount, line.currencyCode)}{" "}
                          c/u
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>

        {/* SUMMARY */}
        <aside className="min-w-[280px] flex-1 lg:sticky lg:top-[90px]">
          <div className="rounded-panel border border-line-soft bg-surface-panel p-[22px]">
            <h2 className="mb-[18px] text-[18px] font-extrabold text-ink-strong">
              {copy.orderSummaryEyebrow}
            </h2>

            <CouponForm
              applied={appliedCoupon}
              copy={copy}
              error={couponError}
              isValidating={isValidatingCoupon}
              onApply={(code) => void handleApplyCoupon(code)}
              onRemove={handleRemoveCoupon}
            />

            <div className="my-[6px] mb-4 h-px bg-surface-muted" />

            <div className="mb-[11px] flex items-baseline justify-between text-[14.5px]">
              <span className="text-ink-muted">{copy.subtotal}</span>
              <span className="font-semibold text-ink-strong">
                {formatMoney(subtotalAmount, currencyCode)}
              </span>
            </div>

            {appliedCoupon ? (
              <div className="mb-[11px] flex items-baseline justify-between text-[14.5px]">
                <span className="text-success-ink">
                  {copy.discount} ({appliedCoupon.code})
                </span>
                <span className="font-semibold text-success-ink">
                  – {formatMoney(discountAmount, currencyCode)}
                </span>
              </div>
            ) : null}

            <div className="my-[10px] mb-[14px] h-px bg-surface-muted" />

            <div className="mb-[18px] flex items-baseline justify-between">
              <span className="text-[17px] font-extrabold text-ink-strong">
                {copy.total}
              </span>
              <span className="whitespace-nowrap text-[24px] font-extrabold tracking-[-0.02em] text-ink-strong">
                {formatMoney(totalAmount, currencyCode)}
              </span>
            </div>

            {hasUnavailableLines ? (
              <div
                className="mb-3 flex items-center gap-[7px] rounded-[9px] bg-warning-surface px-[11px] py-2 text-[12.5px] font-semibold text-warning-line"
                role="alert"
              >
                <span className="flex-shrink-0">⚠</span>
                Revisá las cantidades sin stock antes de continuar.
              </div>
            ) : null}

            <div className="rounded-card border border-line-soft bg-surface-sand p-4 text-[13.5px] text-ink-muted">
              <p className="font-semibold text-ink-strong">
                {copy.deliveryScopeTitle}
              </p>
              <p className="mt-2 leading-[1.55]">
                {copy.deliveryScopeDescription}
              </p>
            </div>

            <CheckoutForm
              copy={copy}
              disabled={hasUnavailableLines}
              error={error}
              isSubmitting={isSubmitting}
              onChange={setCheckoutForm}
              onSubmit={() => void handleCheckout()}
              value={checkoutForm}
            />

            <div className="mt-[14px] flex items-center justify-center gap-[7px] text-[12px] text-ink-soft">
              <span>🔒</span> Pago protegido con Mercado Pago
            </div>
          </div>
        </aside>
      </div>
    </main>
  );
}
