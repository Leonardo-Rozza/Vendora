import Link from "next/link";
import { formatMoney } from "@/lib/commerce/format";
import type { CatalogProductCard } from "@/lib/contracts";
import { appCopy, getProductCategoryLabel } from "@/lib/copy/es-ar";
import { Button } from "@/components/ui/button";
import { Panel } from "@/components/ui/panel";
import { Pill } from "@/components/ui/pill";
import { SectionHeading } from "@/components/ui/section-heading";

type CatalogGridProps = {
  activeLabel: string;
  error: string | null;
  isLoading: boolean;
  onRetry: () => void;
  products: CatalogProductCard[];
};

export function CatalogGrid({
  activeLabel,
  error,
  isLoading,
  onRetry,
  products,
}: CatalogGridProps) {
  const copy = appCopy.storefrontCatalog;

  return (
    <Panel className="p-5 sm:p-6">
      <SectionHeading
        action={<Pill className="text-[var(--brand-deep)]">{activeLabel}</Pill>}
        eyebrow={copy.resultsEyebrow}
        title={copy.resultsTitle}
      />

      {error ? (
        <div className="mt-8 rounded-[1.6rem] border border-[var(--warning-line)] bg-[var(--warning-surface)] p-5 text-sm text-[var(--ink-strong)]">
          <p className="font-semibold">{copy.retryTitle}</p>
          <p className="mt-2 text-[var(--ink-muted)]">{error}</p>
          <Button className="mt-4" onClick={onRetry} variant="secondary">
            {copy.retryAction}
          </Button>
        </div>
      ) : null}

      {isLoading ? (
        <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }, (_, index) => (
            <div
              key={index}
              className="h-72 animate-pulse rounded-[1.6rem] border border-[var(--line-soft)] bg-white/70"
            />
          ))}
        </div>
      ) : null}

      {!isLoading && !error && products.length === 0 ? (
        <div className="mt-8 rounded-[1.6rem] border border-[var(--line-soft)] bg-white/70 p-6 text-sm text-[var(--ink-muted)]">
          <p className="font-semibold text-[var(--ink-strong)]">{copy.emptyTitle}</p>
          <p className="mt-3 leading-7">{copy.emptyDescription}</p>
        </div>
      ) : null}

      {!isLoading && !error && products.length > 0 ? (
        <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {products.map((product) => (
            <article
              key={product.id}
              className="overflow-hidden rounded-[1.75rem] border border-[var(--line-soft)] bg-white/82 shadow-[0_14px_60px_rgba(74,54,39,0.08)]"
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
                    {copy.imagePending}
                  </div>
                )}
              </div>
              <div className="p-5">
                <div className="flex flex-wrap items-center gap-2">
                  {product.category ? (
                    <Pill className="bg-[var(--accent-sky)] text-[var(--brand-ink)]">
                      {getProductCategoryLabel(product.category)}
                    </Pill>
                  ) : null}
                  <Pill className="text-[var(--brand-deep)]">
                    {product.variants.length} {copy.variantsSuffix}
                  </Pill>
                </div>
                <h3 className="mt-4 text-2xl font-semibold tracking-[-0.04em] text-[var(--ink-strong)]">
                  {product.name}
                </h3>
                <p className="mt-3 min-h-16 text-sm leading-7 text-[var(--ink-muted)]">
                  {product.description ?? "Explora el detalle para ver variantes e imagenes."}
                </p>
                <div className="mt-5 flex items-center justify-between gap-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.24em] text-[var(--ink-soft)]">
                      {copy.startingAt}
                    </p>
                    <p className="mt-1 text-lg font-semibold text-[var(--ink-strong)]">
                      {product.startingPriceAmount && product.currencyCode
                        ? formatMoney(product.startingPriceAmount, product.currencyCode)
                        : copy.noPrice}
                    </p>
                  </div>
                  <Link
                    className="inline-flex items-center justify-center rounded-full bg-[var(--ink-strong)] px-4 py-2.5 text-sm font-semibold text-[var(--surface-base)] transition duration-150 hover:-translate-y-0.5"
                    href={`/products/${product.slug}`}
                  >
                    {copy.viewProduct}
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : null}
    </Panel>
  );
}
