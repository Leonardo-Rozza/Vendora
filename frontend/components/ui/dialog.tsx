"use client";

import { useEffect, useId, useRef } from "react";
import type { ReactNode } from "react";

export function Dialog({
  open,
  onClose,
  title,
  children,
  footer,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  const titleId = useId();

  useEffect(() => {
    if (!open) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    panelRef.current?.focus();

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, onClose]);

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        aria-label="Cerrar"
        className="absolute inset-0 cursor-default bg-[rgba(30,32,34,0.55)]"
        onClick={onClose}
        type="button"
      />
      <div
        aria-labelledby={titleId}
        aria-modal="true"
        className="relative z-10 w-full max-w-md rounded-panel bg-surface-base p-7 shadow-strong outline-none"
        ref={panelRef}
        role="dialog"
        tabIndex={-1}
      >
        <div className="flex items-start justify-between gap-4">
          <h2
            className="text-[22px] font-extrabold tracking-[-0.02em] text-ink-strong"
            id={titleId}
          >
            {title}
          </h2>
          <button
            aria-label="Cerrar"
            className="-mt-1 rounded-full px-2 text-xl text-ink-soft transition-colors hover:text-ink-strong"
            onClick={onClose}
            type="button"
          >
            ✕
          </button>
        </div>
        <div className="mt-3 text-sm leading-relaxed text-ink-muted">
          {children}
        </div>
        {footer ? (
          <div className="mt-6 flex justify-end gap-3">{footer}</div>
        ) : null}
      </div>
    </div>
  );
}
