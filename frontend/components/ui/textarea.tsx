"use client";

import { forwardRef } from "react";
import type { TextareaHTMLAttributes } from "react";
import { cn } from "./cn";
import { useFieldControl } from "./field";

export const Textarea = forwardRef<
  HTMLTextAreaElement,
  TextareaHTMLAttributes<HTMLTextAreaElement> & { invalid?: boolean }
>(function Textarea({ className, invalid, ...props }, ref) {
  const fieldProps = useFieldControl();
  const isInvalid = invalid ?? fieldProps["aria-invalid"];

  return (
    <textarea
      ref={ref}
      className={cn(
        "min-h-24 w-full rounded-card border bg-surface-panel px-4 py-3 text-sm text-ink-strong outline-none transition placeholder:text-ink-soft focus-visible:border-brand-deep focus-visible:ring-2 focus-visible:ring-brand-deep/25 disabled:opacity-55",
        isInvalid ? "border-warning-line" : "border-line-soft",
        className,
      )}
      {...fieldProps}
      {...props}
    />
  );
});
