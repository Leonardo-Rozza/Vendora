"use client";

import { cn } from "./cn";

/** Builds a compact page window: 1 … (p-1) p (p+1) … last. */
function buildPageWindow(page: number, pageCount: number): (number | "ellipsis")[] {
  const candidates = new Set<number>([
    1,
    pageCount,
    page - 1,
    page,
    page + 1,
  ]);
  const visible = [...candidates]
    .filter((value) => value >= 1 && value <= pageCount)
    .sort((a, b) => a - b);

  const result: (number | "ellipsis")[] = [];
  let previous = 0;

  for (const value of visible) {
    if (previous && value - previous > 1) {
      result.push("ellipsis");
    }
    result.push(value);
    previous = value;
  }

  return result;
}

export function Pagination({
  page,
  pageCount,
  onPageChange,
  className,
}: {
  page: number;
  pageCount: number;
  onPageChange: (page: number) => void;
  className?: string;
}) {
  if (pageCount <= 1) {
    return null;
  }

  const pages = buildPageWindow(page, pageCount);
  const itemClass =
    "inline-flex min-w-9 items-center justify-center rounded-full border px-3 py-1.5 text-sm transition disabled:cursor-not-allowed disabled:opacity-45";

  return (
    <nav aria-label="Paginación" className={cn("flex items-center gap-2", className)}>
      <button
        className={cn(itemClass, "border-line-soft bg-surface-panel text-ink-strong")}
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
        type="button"
      >
        ‹<span className="sr-only">Página anterior</span>
      </button>

      {pages.map((value, index) =>
        value === "ellipsis" ? (
          <span
            aria-hidden
            className="px-1 text-ink-soft"
            key={`ellipsis-${index}`}
          >
            …
          </span>
        ) : (
          <button
            aria-current={value === page ? "page" : undefined}
            className={cn(
              itemClass,
              value === page
                ? "border-transparent bg-ink-strong text-surface-base"
                : "border-line-soft bg-surface-panel text-ink-strong",
            )}
            key={value}
            onClick={() => onPageChange(value)}
            type="button"
          >
            {value}
          </button>
        ),
      )}

      <button
        className={cn(itemClass, "border-line-soft bg-surface-panel text-ink-strong")}
        disabled={page >= pageCount}
        onClick={() => onPageChange(page + 1)}
        type="button"
      >
        ›<span className="sr-only">Página siguiente</span>
      </button>
    </nav>
  );
}
