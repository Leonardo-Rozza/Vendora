"use client";

import { forwardRef } from "react";
import type { InputHTMLAttributes } from "react";
import { cn } from "./cn";
import { useFieldControl } from "./field";

const CONTROL_CLASSNAME =
  "w-full rounded-field border-[1.5px] bg-surface-panel px-3.5 py-3 text-[15px] text-ink-strong outline-none transition placeholder:text-ink-soft focus-visible:border-brand-deep focus-visible:outline-3 focus-visible:outline-offset-0 focus-visible:outline-[#e7cfae] disabled:cursor-not-allowed disabled:border-line-soft disabled:bg-surface-sand disabled:text-ink-faint";

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
        isInvalid ? "border-danger-ink text-danger-ink" : "border-line-strong",
        className,
      )}
      {...fieldProps}
      {...props}
    />
  );
});
