"use client";

import { forwardRef } from "react";
import type { InputHTMLAttributes } from "react";
import { cn } from "./cn";
import { useFieldControl } from "./field";

const CONTROL_CLASSNAME =
  "w-full rounded-field border bg-surface-panel px-4 py-2.5 text-sm text-ink-strong outline-none transition placeholder:text-ink-soft focus-visible:border-brand-deep focus-visible:ring-2 focus-visible:ring-brand-deep/25 disabled:opacity-55";

export const Input = forwardRef<
  HTMLInputElement,
  InputHTMLAttributes<HTMLInputElement> & { invalid?: boolean }
>(function Input({ className, invalid, ...props }, ref) {
  const fieldProps = useFieldControl();
  const isInvalid = invalid ?? fieldProps["aria-invalid"];

  return (
    <input
      ref={ref}
      className={cn(
        CONTROL_CLASSNAME,
        isInvalid ? "border-warning-line" : "border-line-soft",
        className,
      )}
      {...fieldProps}
      {...props}
    />
  );
});
