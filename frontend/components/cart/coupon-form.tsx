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
    <div className="mb-[18px]">
      <label
        className="mb-[7px] block text-[13px] font-semibold text-ink-strong"
        htmlFor="checkout-coupon-code"
      >
        {copy.couponSection}
      </label>

      {applied ? (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="inline-flex items-center gap-2 rounded-full bg-success-surface px-3 py-1 text-xs font-bold uppercase tracking-[0.04em] text-success-ink">
            {copy.couponApplied}: {applied.code}
          </span>
          <button
            className="text-sm font-bold text-brand-deep transition-colors hover:text-brand-hover"
            onClick={onRemove}
            type="button"
          >
            {copy.couponRemove}
          </button>
        </div>
      ) : (
        <div className="flex gap-2">
          <input
            aria-invalid={error ? true : undefined}
            className="min-w-0 flex-1 rounded-[10px] border-[1.5px] border-line-strong bg-surface-panel px-3 py-[10px] text-sm uppercase text-ink-strong outline-none transition placeholder:text-ink-faint focus-visible:border-brand-deep focus-visible:outline-3 focus-visible:outline-offset-0 focus-visible:outline-[#e7cfae]"
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
            className="rounded-[10px] border-[1.5px] border-line-strong bg-surface-panel px-4 py-[10px] text-sm font-bold text-brand-deep transition-colors hover:border-brand-deep hover:bg-surface-base disabled:cursor-not-allowed disabled:opacity-60"
            disabled={isValidating || code.trim().length === 0}
            onClick={handleApply}
            type="button"
          >
            {isValidating ? copy.couponApplying : copy.couponApply}
          </button>
        </div>
      )}

      {error ? (
        <p className="mt-2 text-[12.5px] font-semibold text-danger-ink" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
