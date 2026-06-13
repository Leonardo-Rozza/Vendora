"use client";

import { forwardRef } from "react";
import type { SelectHTMLAttributes } from "react";
import { cn } from "./cn";
import { useFieldControl } from "./field";

export const Select = forwardRef<
  HTMLSelectElement,
  SelectHTMLAttributes<HTMLSelectElement> & { invalid?: boolean }
>(function Select({ className, invalid, children, ...props }, ref) {
  const fieldProps = useFieldControl();
  const isInvalid = invalid ?? fieldProps["aria-invalid"];

  return (
    <div className="relative">
      <select
        ref={ref}
        className={cn(
          "w-full cursor-pointer appearance-none rounded-field border-[1.5px] bg-surface-panel py-3 pr-10 pl-3.5 text-[15px] text-ink-strong outline-none transition focus-visible:border-brand-deep focus-visible:outline-3 focus-visible:outline-offset-0 focus-visible:outline-[#e7cfae] disabled:cursor-not-allowed disabled:border-line-soft disabled:bg-surface-sand disabled:text-ink-faint",
          isInvalid ? "border-danger-ink" : "border-line-strong",
          className,
        )}
        {...fieldProps}
        {...props}
      >
        {children}
      </select>
      <span
        aria-hidden
        className="pointer-events-none absolute top-1/2 right-3.5 -translate-y-1/2 text-[10px] text-ink-soft"
      >
        ▼
      </span>
    </div>
  );
});
