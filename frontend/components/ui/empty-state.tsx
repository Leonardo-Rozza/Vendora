import type { ReactNode } from "react";
import { cn } from "./cn";

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center gap-3 rounded-card border border-dashed border-line-soft bg-surface-panel px-6 py-12 text-center",
        className,
      )}
    >
      {icon ? <div className="text-ink-soft">{icon}</div> : null}
      <h3 className="text-lg font-semibold text-ink-strong">{title}</h3>
      {description ? (
        <p className="max-w-sm text-sm leading-7 text-ink-muted">
          {description}
        </p>
      ) : null}
      {action ? <div className="mt-2">{action}</div> : null}
    </div>
  );
}
