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
    "bg-brand-deep text-surface-base hover:bg-brand-hover disabled:bg-surface-sand disabled:text-ink-faint",
  secondary:
    "border-2 border-line-strong bg-surface-panel text-brand-deep hover:border-brand-deep hover:bg-surface-base disabled:border-line-soft disabled:text-ink-faint",
  ghost:
    "bg-transparent text-brand-deep hover:bg-surface-sand disabled:text-ink-faint",
  danger:
    "bg-danger-ink text-white hover:bg-[#8c2a21] disabled:bg-surface-sand disabled:text-ink-faint",
};

const SIZE_CLASSNAMES: Record<ButtonSize, string> = {
  sm: "rounded-[9px] px-3.5 py-2 text-[13px]",
  md: "rounded-field px-5 py-3 text-[15px]",
  lg: "rounded-[14px] px-7 py-4 text-[17px]",
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
        "inline-flex items-center justify-center gap-2 font-bold transition-colors duration-150 outline-none focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-accent-sand disabled:cursor-not-allowed",
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
