import type { ButtonHTMLAttributes, ReactNode } from "react";

type ButtonVariant = "primary" | "secondary" | "ghost";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  variant?: ButtonVariant;
};

const VARIANT_CLASSNAMES: Record<ButtonVariant, string> = {
  primary:
    "bg-[var(--ink-strong)] text-[var(--surface-base)] hover:-translate-y-0.5 disabled:translate-y-0",
  secondary:
    "border border-[var(--line-soft)] bg-white text-[var(--ink-strong)] hover:-translate-y-0.5 disabled:translate-y-0",
  ghost:
    "bg-transparent text-[var(--ink-strong)] hover:bg-white/70",
};

export function Button({
  children,
  className,
  type = "button",
  variant = "primary",
  ...props
}: ButtonProps) {
  return (
    <button
      className={[
        "inline-flex items-center justify-center rounded-full px-4 py-2.5 text-sm font-semibold transition duration-150 disabled:opacity-60",
        VARIANT_CLASSNAMES[variant],
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      type={type}
      {...props}
    >
      {children}
    </button>
  );
}
