import type { ReactNode } from "react";

export function SectionHeading({
  eyebrow,
  title,
  detail,
  action,
}: {
  eyebrow: string;
  title: string;
  detail?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p className="font-mono text-xs uppercase tracking-[0.28em] text-[var(--ink-soft)]">
          {eyebrow}
        </p>
        <h2 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-[var(--ink-strong)]">
          {title}
        </h2>
        {detail ? <p className="mt-3 max-w-2xl text-sm leading-7 text-[var(--ink-muted)]">{detail}</p> : null}
      </div>
      {action ? <div>{action}</div> : null}
    </div>
  );
}
