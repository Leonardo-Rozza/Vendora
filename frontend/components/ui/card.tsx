import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "./cn";

type CardVariant = "panel" | "outline" | "glass";

const VARIANT_CLASSNAMES: Record<CardVariant, string> = {
  panel: "border border-line-soft bg-surface-panel shadow-soft",
  outline: "border border-line-soft bg-transparent",
  glass: "border border-white/45 bg-white/75 shadow-medium backdrop-blur",
};

export function Card({
  children,
  className,
  variant = "panel",
  ...props
}: HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
  variant?: CardVariant;
}) {
  return (
    <div
      className={cn(
        "rounded-card p-6",
        VARIANT_CLASSNAMES[variant],
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}
