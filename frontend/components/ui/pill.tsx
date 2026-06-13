import type { HTMLAttributes, ReactNode } from "react";

export function Pill({
  children,
  className,
  ...props
}: HTMLAttributes<HTMLSpanElement> & { children: ReactNode }) {
  return (
    <span
      className={[
        "inline-flex items-center rounded-full border border-line-soft bg-surface-sand px-3 py-1 font-mono text-[11px] font-bold uppercase tracking-[0.14em] text-ink-muted",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...props}
    >
      {children}
    </span>
  );
}
