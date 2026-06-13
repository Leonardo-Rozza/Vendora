import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "./cn";

type BadgeTone = "neutral" | "brand" | "warning" | "success" | "info";

const TONE_CLASSNAMES: Record<BadgeTone, string> = {
  neutral: "border-line-soft bg-white/80 text-ink-strong",
  brand: "border-transparent bg-[rgba(140,75,38,0.12)] text-brand-deep",
  warning: "border-warning-line bg-warning-surface text-ink-strong",
  success: "border-transparent bg-[rgba(46,113,86,0.14)] text-[#2e7156]",
  info: "border-transparent bg-accent-sky text-brand-ink",
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
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold",
        TONE_CLASSNAMES[tone],
        className,
      )}
      {...props}
    >
      {children}
    </span>
  );
}
