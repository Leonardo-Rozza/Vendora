import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "./cn";

type BadgeTone =
  | "neutral"
  | "brand"
  | "warning"
  | "success"
  | "info"
  | "danger";

const TONE_CLASSNAMES: Record<BadgeTone, string> = {
  neutral: "bg-surface-sand text-ink-muted",
  brand: "bg-brand-deep text-white",
  warning: "bg-warning-surface text-warning-line",
  success: "bg-success-surface text-success-ink",
  info: "bg-[#e0eaed] text-[#21505f]",
  danger: "bg-danger-surface text-danger-ink",
};

export function Badge({
  children,
  className,
  tone = "neutral",
  ...props
}: HTMLAttributes<HTMLSpanElement> & {
  children: ReactNode;
  tone?: BadgeTone;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-[7px] px-2.5 py-1 text-xs font-bold",
        TONE_CLASSNAMES[tone],
        className,
      )}
      {...props}
    >
      {children}
    </span>
  );
}
