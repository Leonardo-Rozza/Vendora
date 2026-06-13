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
        "min-h-24 w-full resize-y rounded-field border-[1.5px] bg-surface-panel px-3.5 py-3 text-[15px] text-ink-strong outline-none transition placeholder:text-ink-soft focus-visible:border-brand-deep focus-visible:outline-3 focus-visible:outline-offset-0 focus-visible:outline-[#e7cfae] disabled:cursor-not-allowed disabled:border-line-soft disabled:bg-surface-sand disabled:text-ink-faint",
        isInvalid ? "border-danger-ink text-danger-ink" : "border-line-strong",
        className,
      )}
      {...fieldProps}
      {...props}
    />
  );
});
