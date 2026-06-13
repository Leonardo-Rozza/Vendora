"use client";

import { useState } from "react";
import type { appCopy } from "@/lib/copy/es-ar";

type CartCopy = (typeof appCopy)["cart"];

export type AppliedCoupon = {
  code: string;
  discountAmount: string;
};

type CouponFormProps = {
  copy: CartCopy;
  applied: AppliedCoupon | null;
  isValidating: boolean;
  error: string | null;
  onApply: (code: string) => void;
  onRemove: () => void;
};

export function CouponForm({
  copy,
  applied,
  isValidating,
  error,
  onApply,
  onRemove,
}: CouponFormProps) {
  const [code, setCode] = useState("");

  function handleApply() {
    const normalized = code.trim();

    if (!normalized || isValidating) {
      return;
    }

    onApply(normalized);
  }

  return (
    <div className="mt-5 rounded-[1.25rem] border border-white/10 bg-black/10 p-4">
      <p className="font-mono text-xs uppercase tracking-[0.24em] text-[var(--accent-sand)]">
        {copy.couponSection}
      </p>

      {applied ? (
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-white">
            {copy.couponApplied}: {applied.code}
          </span>
          <button
            className="text-sm font-semibold text-[var(--accent-sand)]"
            onClick={onRemove}
            type="button"
          >
            {copy.couponRemove}
          </button>
        </div>
      ) : (
        <div className="mt-3 flex flex-col gap-3 sm:flex-row">
          <label className="sr-only" htmlFor="checkout-coupon-code">
            {copy.couponLabel}
          </label>
          <input
            aria-invalid={error ? true : undefined}
            className="w-full flex-1 rounded-full border border-white/14 bg-white/10 px-4 py-3 text-sm text-white outline-none placeholder:text-white/44"
            id="checkout-coupon-code"
            onChange={(event) => setCode(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                handleApply();
              }
            }}
            placeholder={copy.couponPlaceholder}
            value={code}
          />
          <button
            className="rounded-full bg-[var(--surface-base)] px-5 py-3 text-sm font-semibold text-[var(--ink-strong)] transition-transform hover:-translate-y-0.5 disabled:translate-y-0 disabled:opacity-60"
            disabled={isValidating || code.trim().length === 0}
            onClick={handleApply}
            type="button"
          >
            {isValidating ? copy.couponApplying : copy.couponApply}
          </button>
        </div>
      )}

      {error ? (
        <p className="mt-3 text-sm text-[var(--accent-sand)]" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
