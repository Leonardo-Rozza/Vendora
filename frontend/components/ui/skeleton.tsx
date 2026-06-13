import type { HTMLAttributes } from "react";
import { cn } from "./cn";

export function Skeleton({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      aria-hidden
      className={cn("animate-pulse rounded-card bg-surface-muted", className)}
      {...props}
    />
  );
}
