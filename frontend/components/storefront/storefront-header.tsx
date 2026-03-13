"use client";

import Link from "next/link";
import { useCommerce } from "@/components/commerce/commerce-provider";

export function StorefrontHeader() {
  const { hasHydrated, itemCount } = useCommerce();

  return (
    <header className="sticky top-0 z-30 border-b border-[var(--line-soft)] bg-[rgba(245,239,228,0.88)] backdrop-blur">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-6 py-4 sm:px-8 lg:px-12">
        <div>
          <Link href="/" className="font-mono text-xs uppercase tracking-[0.34em] text-[var(--ink-soft)]">
            Vendora storefront
          </Link>
          <p className="mt-2 text-sm text-[var(--ink-muted)]">
            Real catalog, cart, and Mercado Pago handoff.
          </p>
        </div>
        <nav className="flex items-center gap-3 text-sm font-semibold text-[var(--ink-strong)]">
          <Link className="rounded-full px-4 py-2 transition-colors hover:bg-white/70" href="/">
            Browse
          </Link>
          <Link className="rounded-full px-4 py-2 transition-colors hover:bg-white/70" href="/admin">
            Admin
          </Link>
          <Link
            className="rounded-full bg-[var(--ink-strong)] px-4 py-2 text-[var(--surface-base)] transition-transform hover:-translate-y-0.5"
            href="/cart"
          >
            Cart {hasHydrated ? `(${itemCount})` : ""}
          </Link>
        </nav>
      </div>
    </header>
  );
}
