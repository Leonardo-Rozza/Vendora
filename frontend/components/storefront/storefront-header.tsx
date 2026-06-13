"use client";

import Link from "next/link";
import { useCommerce } from "@/components/commerce/commerce-provider";
import { appCopy } from "@/lib/copy/es-ar";

export function StorefrontHeader() {
  const { hasHydrated, itemCount } = useCommerce();
  const copy = appCopy.storefrontHeader;

  return (
    <header className="sticky top-0 z-30 border-b border-line-soft bg-surface-base">
      <div className="bg-brand-ink px-4 py-1.5 text-center text-[12.5px] font-medium text-[#c9d6db]">
        Envío gratis en AMBA en compras desde $120.000 ·{" "}
        <span className="text-accent-sand">Pagá con Mercado Pago</span>
      </div>
      <div className="mx-auto flex w-full max-w-7xl items-center gap-4 px-6 py-4 sm:px-8 lg:px-12">
        <Link
          href="/"
          className="flex flex-shrink-0 items-center gap-3"
          aria-label={copy.brand}
        >
          <span className="grid size-10 place-items-center rounded-[11px] bg-brand-deep text-xl font-extrabold text-surface-base">
            V
          </span>
          <span className="text-xl font-extrabold tracking-[-0.02em] text-ink-strong">
            Vendora
          </span>
        </Link>
        <nav className="ml-auto flex flex-wrap items-center justify-end gap-1 text-sm font-semibold text-ink-strong sm:gap-2">
          <Link
            className="rounded-full px-3 py-2 transition-colors hover:bg-surface-sand"
            href="/"
          >
            {copy.browse}
          </Link>
          <Link
            className="rounded-full px-3 py-2 transition-colors hover:bg-surface-sand"
            href="/#categorias"
          >
            {copy.categories}
          </Link>
          <Link
            className="rounded-full px-3 py-2 transition-colors hover:bg-surface-sand"
            href="/#explorar"
          >
            {copy.explore}
          </Link>
          <Link
            className="rounded-full px-3 py-2 transition-colors hover:bg-surface-sand"
            href="/admin"
          >
            {copy.admin}
          </Link>
          <Link
            className="ml-1 inline-flex items-center gap-2 rounded-field bg-brand-deep px-4 py-2.5 font-bold text-surface-base transition-colors hover:bg-brand-hover"
            href="/cart"
          >
            <span aria-hidden>🛒</span>
            <span>{copy.cart}</span>
            {hasHydrated ? (
              <span className="inline-block min-w-5 text-center">
                {itemCount}
              </span>
            ) : null}
          </Link>
        </nav>
      </div>
    </header>
  );
}
