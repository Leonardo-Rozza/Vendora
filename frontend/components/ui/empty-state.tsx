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
        "flex flex-col items-center rounded-card border border-line-soft bg-surface-panel px-6 py-10 text-center",
        className,
      )}
    >
      {icon ? (
        <div className="mb-4 grid size-14 place-items-center rounded-card bg-surface-sand text-2xl text-ink-soft">
          {icon}
        </div>
      ) : null}
      <h3 className="text-[17px] font-bold text-ink-strong">{title}</h3>
      {description ? (
        <p className="mt-2 max-w-[32ch] text-sm leading-relaxed text-ink-muted">
          {description}
        </p>
      ) : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}
