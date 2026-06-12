"use client";

import Link from "next/link";
import { appCopy } from "@/lib/copy/es-ar";

export default function ProductError({ reset }: { reset: () => void }) {
  const copy = appCopy.productDetail;

  return (
    <main className="mx-auto w-full max-w-4xl px-6 py-12 sm:px-8 lg:px-12">
      <div className="rounded-[2rem] border border-[var(--warning-line)] bg-[var(--warning-surface)] p-8 text-[var(--ink-strong)] shadow-[0_20px_70px_rgba(61,43,28,0.08)]">
        <p className="font-semibold">{copy.temporaryError}</p>
        <div className="mt-6 flex flex-wrap gap-3">
          <button
            className="inline-flex rounded-full bg-[var(--ink-strong)] px-5 py-3 text-sm font-semibold text-[var(--surface-base)]"
            onClick={() => reset()}
            type="button"
          >
            Reintentar
          </button>
          <Link
            className="inline-flex rounded-full border border-[var(--line-strong)] px-5 py-3 text-sm font-semibold"
            href="/"
          >
            {copy.backToCatalog}
          </Link>
        </div>
      </div>
    </main>
  );
}
