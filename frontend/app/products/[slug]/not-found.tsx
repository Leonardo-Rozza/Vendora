import Link from "next/link";
import { appCopy } from "@/lib/copy/es-ar";

export default function ProductNotFound() {
  const copy = appCopy.productDetail;

  return (
    <main className="mx-auto w-full max-w-4xl px-6 py-12 sm:px-8 lg:px-12">
      <div className="rounded-[2rem] border border-[var(--line-soft)] bg-white/78 p-8 shadow-[0_20px_70px_rgba(61,43,28,0.08)]">
        <p className="font-mono text-xs uppercase tracking-[0.34em] text-[var(--ink-soft)]">
          {copy.missingEyebrow}
        </p>
        <h1 className="mt-4 text-4xl font-semibold tracking-[-0.05em] text-[var(--ink-strong)]">
          {copy.missingTitle}
        </h1>
        <p className="mt-4 text-sm leading-7 text-[var(--ink-muted)]">
          {copy.missingDescription}
        </p>
        <Link
          className="mt-6 inline-flex rounded-full bg-[var(--ink-strong)] px-5 py-3 text-sm font-semibold text-[var(--surface-base)]"
          href="/"
        >
          {copy.backToCatalog}
        </Link>
      </div>
    </main>
  );
}
