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
    <select
      ref={ref}
      className={cn(
        "w-full appearance-none rounded-field border bg-surface-panel px-4 py-2.5 text-sm text-ink-strong outline-none transition focus-visible:border-brand-deep focus-visible:ring-2 focus-visible:ring-brand-deep/25 disabled:opacity-55",
        isInvalid ? "border-warning-line" : "border-line-soft",
        className,
      )}
      {...fieldProps}
      {...props}
    >
      {children}
    </select>
  );
});
