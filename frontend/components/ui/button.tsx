import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "./cn";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
type ButtonSize = "sm" | "md" | "lg";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
};

const VARIANT_CLASSNAMES: Record<ButtonVariant, string> = {
  primary:
    "bg-ink-strong text-surface-base hover:-translate-y-0.5 disabled:translate-y-0",
  secondary:
    "border border-line-soft bg-surface-panel text-ink-strong hover:-translate-y-0.5 disabled:translate-y-0",
  ghost: "bg-transparent text-ink-strong hover:bg-white/70",
  danger:
    "bg-[var(--warning-line)] text-surface-base hover:-translate-y-0.5 disabled:translate-y-0",
};

const SIZE_CLASSNAMES: Record<ButtonSize, string> = {
  sm: "px-3 py-1.5 text-xs",
  md: "px-4 py-2.5 text-sm",
  lg: "px-5 py-3 text-base",
};

export function Button({
  children,
  className,
  type = "button",
  variant = "primary",
  size = "md",
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-field font-semibold transition duration-150 outline-none focus-visible:ring-2 focus-visible:ring-brand-deep/30 disabled:cursor-not-allowed disabled:opacity-60",
        VARIANT_CLASSNAMES[variant],
        SIZE_CLASSNAMES[size],
        className,
      )}
      type={type}
      {...props}
    >
      {children}
    </button>
  );
}
