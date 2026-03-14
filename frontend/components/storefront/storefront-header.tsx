"use client";

import Link from "next/link";
import { useCommerce } from "@/components/commerce/commerce-provider";
import { appCopy } from "@/lib/copy/es-ar";

export function StorefrontHeader() {
  const { hasHydrated, itemCount } = useCommerce();
  const copy = appCopy.storefrontHeader;

  return (
    <header className="sticky top-0 z-30 border-b border-[var(--line-soft)] bg-[rgba(245,239,228,0.88)] backdrop-blur">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-6 py-4 sm:px-8 lg:px-12">
        <div>
          <Link href="/" className="font-mono text-xs uppercase tracking-[0.34em] text-[var(--ink-soft)]">
            {copy.brand}
          </Link>
          <p className="mt-2 text-sm text-[var(--ink-muted)]">
            {copy.tagline}
          </p>
        </div>
        <nav className="flex flex-wrap items-center justify-end gap-2 text-sm font-semibold text-[var(--ink-strong)] sm:gap-3">
          <Link className="rounded-full px-4 py-2 transition-colors hover:bg-white/70" href="/">
            {copy.browse}
          </Link>
          <Link className="rounded-full px-4 py-2 transition-colors hover:bg-white/70" href="/#categorias">
            {copy.categories}
          </Link>
          <Link className="rounded-full px-4 py-2 transition-colors hover:bg-white/70" href="/#explorar">
            {copy.explore}
          </Link>
          <Link className="rounded-full px-4 py-2 transition-colors hover:bg-white/70" href="/admin">
            {copy.admin}
          </Link>
          <Link
            className="rounded-full bg-[var(--ink-strong)] px-4 py-2 text-[var(--surface-base)] transition-transform hover:-translate-y-0.5"
            href="/cart"
          >
            {copy.cart} {hasHydrated ? `(${itemCount})` : ""}
          </Link>
        </nav>
      </div>
    </header>
  );
}
