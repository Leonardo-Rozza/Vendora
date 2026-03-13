"use client";

import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import { listCatalogProducts } from "@/lib/commerce/api";
import { toCatalogErrorMessage } from "@/lib/commerce/catalog";
import { formatMoney } from "@/lib/commerce/format";
import type { CatalogProductCard } from "@/lib/contracts";

export function CatalogExperience() {
  const [products, setProducts] = useState<CatalogProductCard[]>([]);
  const [query, setQuery] = useState("");
  const [activeQuery, setActiveQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadProducts(nextQuery = "") {
    setIsLoading(true);
    setError(null);

    try {
      const nextProducts = await listCatalogProducts(nextQuery);
      setProducts(nextProducts);
      setActiveQuery(nextQuery);
    } catch (caughtError) {
      setError(toCatalogErrorMessage(caughtError));
      setProducts([]);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadProducts();
  }, []);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void loadProducts(query);
  }

  return (
    <section className="grid gap-6 lg:grid-cols-[0.88fr_1.12fr]">
      <article className="rounded-[2rem] border border-white/55 bg-white/78 p-6 shadow-[0_24px_90px_rgba(82,56,34,0.12)] backdrop-blur">
        <p className="font-mono text-xs uppercase tracking-[0.34em] text-[var(--ink-soft)]">
          Storefront commerce flow
        </p>
        <h1 className="mt-3 max-w-2xl text-4xl font-semibold tracking-[-0.05em] text-[var(--ink-strong)] sm:text-5xl">
          Discover real catalog inventory and move straight into checkout.
        </h1>
        <p className="mt-5 max-w-2xl text-base leading-8 text-[var(--ink-muted)] sm:text-lg">
          The shell now speaks to the backend catalog, carries a persistent cart,
          and hands shoppers into Mercado Pago without drifting into admin,
          fulfillment, or account features.
        </p>
        <form className="mt-8 flex flex-col gap-3 sm:flex-row" onSubmit={handleSubmit}>
          <label className="flex-1">
            <span className="sr-only">Search the catalog</span>
            <input
              className="w-full rounded-full border border-[var(--line-soft)] bg-[var(--surface-panel)] px-5 py-3 text-sm text-[var(--ink-strong)] outline-none transition focus:border-[var(--brand-deep)]"
              name="query"
              placeholder="Search by product name or SKU"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </label>
          <button
            className="rounded-full bg-[var(--ink-strong)] px-5 py-3 text-sm font-semibold text-[var(--surface-base)] transition-transform hover:-translate-y-0.5 disabled:translate-y-0 disabled:opacity-60"
            disabled={isLoading}
            type="submit"
          >
            {isLoading ? "Searching..." : "Search catalog"}
          </button>
        </form>
        <div className="mt-8 grid gap-3 sm:grid-cols-3">
          {[
            "Catalog search",
            "Variant-aware product detail",
            "Cart to Mercado Pago handoff",
          ].map((label) => (
            <div
              key={label}
              className="rounded-[1.4rem] border border-[var(--line-soft)] bg-[var(--surface-panel)] px-4 py-4 text-sm font-medium text-[var(--ink-strong)]"
            >
              {label}
            </div>
          ))}
        </div>
      </article>

      <article className="rounded-[2rem] border border-[var(--line-soft)] bg-[var(--surface-panel)] p-6 shadow-[0_20px_70px_rgba(61,43,28,0.08)]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.3em] text-[var(--ink-soft)]">
              Catalog landing
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-[var(--ink-strong)]">
              Active products from the backend catalog API.
            </h2>
          </div>
          <span className="rounded-full border border-[var(--line-soft)] bg-white/75 px-3 py-1 font-mono text-xs uppercase tracking-[0.24em] text-[var(--brand-deep)]">
            {activeQuery ? `Query: ${activeQuery}` : "All active products"}
          </span>
        </div>

        {error ? (
          <div className="mt-8 rounded-[1.6rem] border border-[var(--warning-line)] bg-[var(--warning-surface)] p-5 text-sm text-[var(--ink-strong)]">
            <p className="font-semibold">Catalog is temporarily unavailable.</p>
            <p className="mt-2 text-[var(--ink-muted)]">{error}</p>
            <button
              className="mt-4 rounded-full border border-[var(--line-strong)] px-4 py-2 font-semibold transition-colors hover:bg-white/75"
              onClick={() => void loadProducts(activeQuery)}
              type="button"
            >
              Retry catalog
            </button>
          </div>
        ) : null}

        {isLoading ? (
          <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 3 }, (_, index) => (
              <div
                key={index}
                className="h-64 animate-pulse rounded-[1.6rem] border border-[var(--line-soft)] bg-white/70"
              />
            ))}
          </div>
        ) : null}

        {!isLoading && !error && products.length === 0 ? (
          <div className="mt-8 rounded-[1.6rem] border border-[var(--line-soft)] bg-white/70 p-6 text-sm text-[var(--ink-muted)]">
            No products match that search yet. Try a broader name or SKU fragment.
          </div>
        ) : null}

        {!isLoading && !error && products.length > 0 ? (
          <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {products.map((product) => (
              <article
                key={product.id}
                className="overflow-hidden rounded-[1.75rem] border border-[var(--line-soft)] bg-white/78 shadow-[0_14px_60px_rgba(74,54,39,0.08)]"
              >
                <div className="aspect-[4/3] bg-[linear-gradient(160deg,rgba(210,120,55,0.24),rgba(24,80,104,0.16))]">
                  {product.primaryImageUrl ? (
                    <img
                      alt={product.primaryImageAlt ?? product.name}
                      className="h-full w-full object-cover"
                      src={product.primaryImageUrl}
                    />
                  ) : (
                    <div className="flex h-full items-end p-5 font-mono text-xs uppercase tracking-[0.28em] text-[var(--ink-strong)]">
                      Image pending
                    </div>
                  )}
                </div>
                <div className="p-5">
                  <p className="font-mono text-xs uppercase tracking-[0.28em] text-[var(--brand-deep)]">
                    {product.variants.length} variants
                  </p>
                  <h3 className="mt-3 text-2xl font-semibold tracking-[-0.04em] text-[var(--ink-strong)]">
                    {product.name}
                  </h3>
                  <p className="mt-3 min-h-14 text-sm leading-7 text-[var(--ink-muted)]">
                    {product.description ?? "Explore the full product detail for variants and imagery."}
                  </p>
                  <div className="mt-5 flex items-center justify-between gap-4">
                    <div>
                      <p className="text-xs uppercase tracking-[0.24em] text-[var(--ink-soft)]">
                        Starting at
                      </p>
                      <p className="mt-1 text-lg font-semibold text-[var(--ink-strong)]">
                        {product.startingPriceAmount && product.currencyCode
                          ? formatMoney(product.startingPriceAmount, product.currencyCode)
                          : "Contact for pricing"}
                      </p>
                    </div>
                    <Link
                      className="rounded-full bg-[var(--ink-strong)] px-4 py-2 text-sm font-semibold text-[var(--surface-base)] transition-transform hover:-translate-y-0.5"
                      href={`/products/${product.slug}`}
                    >
                      View product
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : null}
      </article>
    </section>
  );
}
