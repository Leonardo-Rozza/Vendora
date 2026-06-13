import Image from "next/image";
import Link from "next/link";
import { formatMoney } from "@/lib/commerce/format";
import type { CatalogProductCard } from "@/lib/contracts";
import { appCopy } from "@/lib/copy/es-ar";
import { Button } from "@/components/ui/button";

type CatalogGridProps = {
  error: string | null;
  isLoading: boolean;
  onRetry: () => void;
  onClearFilters: () => void;
  products: CatalogProductCard[];
};

const stripeBackground =
  "repeating-linear-gradient(45deg, #F4EDE0, #F4EDE0 9px, #EFE6D6 9px, #EFE6D6 18px)";

export function CatalogGrid({
  error,
  isLoading,
  onRetry,
  onClearFilters,
  products,
}: CatalogGridProps) {
  const copy = appCopy.storefrontCatalog;

  if (isLoading) {
    return (
      <div className="grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-[18px]">
        {Array.from({ length: 8 }, (_, index) => (
          <div key={index}>
            <div className="aspect-square animate-[vd-shimmer_1.3s_infinite_linear] rounded-[14px] bg-[linear-gradient(90deg,#F0E8DA_25%,#E7DCC9_37%,#F0E8DA_63%)] bg-[length:420px_100%]" />
            <div className="mt-3.5 h-[11px] w-[45%] animate-[vd-shimmer_1.3s_infinite_linear] rounded-md bg-[linear-gradient(90deg,#F0E8DA_25%,#E7DCC9_37%,#F0E8DA_63%)] bg-[length:420px_100%]" />
            <div className="mt-2.5 h-3.5 w-[88%] animate-[vd-shimmer_1.3s_infinite_linear] rounded-md bg-[linear-gradient(90deg,#F0E8DA_25%,#E7DCC9_37%,#F0E8DA_63%)] bg-[length:420px_100%]" />
            <div className="mt-3 h-[18px] w-[38%] animate-[vd-shimmer_1.3s_infinite_linear] rounded-md bg-[linear-gradient(90deg,#F0E8DA_25%,#E7DCC9_37%,#F0E8DA_63%)] bg-[length:420px_100%]" />
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div
        className="rounded-[18px] border border-line-soft bg-surface-panel px-6 py-14 text-center"
        role="alert"
      >
        <div className="mx-auto mb-[18px] grid size-[60px] place-items-center rounded-[17px] bg-danger-surface text-[28px] font-extrabold text-danger-ink">
          !
        </div>
        <div className="text-[19px] font-extrabold text-ink-strong">
          {copy.retryTitle}
        </div>
        <p className="mx-auto mt-2.5 max-w-[36ch] text-[14.5px] leading-relaxed text-ink-muted">
          {error}
        </p>
        <Button className="mt-5" onClick={onRetry}>
          {copy.retryAction}
        </Button>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="rounded-[18px] border border-line-soft bg-surface-panel px-6 py-14 text-center">
        <div className="mx-auto mb-[18px] grid size-[60px] place-items-center rounded-[17px] bg-surface-sand text-[26px]">
          🔍
        </div>
        <div className="text-[19px] font-extrabold text-ink-strong">
          {copy.emptyTitle}
        </div>
        <p className="mx-auto mt-2.5 max-w-[36ch] text-[14.5px] leading-relaxed text-ink-muted">
          {copy.emptyDescription}
        </p>
        <Button className="mt-5" onClick={onClearFilters} variant="secondary">
          {copy.clearFilters}
        </Button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-[18px]">
      {products.map((product) => {
        const price =
          product.startingPriceAmount && product.currencyCode
            ? formatMoney(product.startingPriceAmount, product.currencyCode)
            : copy.noPrice;

        return (
          <article
            key={product.id}
            className="group overflow-hidden rounded-card border border-line-soft bg-surface-panel transition-all duration-200 hover:-translate-y-[3px] hover:border-accent-sand hover:shadow-medium"
          >
            <Link
              className="block"
              href={`/products/${product.slug}`}
              aria-label={product.name}
            >
              <div
                className="relative grid aspect-square place-items-center"
                style={{ background: stripeBackground }}
              >
                {product.primaryImageUrl ? (
                  <Image
                    alt={product.primaryImageAlt ?? product.name}
                    className="object-cover"
                    fill
                    sizes="(min-width: 1280px) 25vw, (min-width: 640px) 33vw, 50vw"
                    src={product.primaryImageUrl}
                  />
                ) : (
                  <span className="font-mono text-[10.5px] uppercase tracking-[0.1em] text-ink-faint">
                    [ {copy.imagePending} ]
                  </span>
                )}
              </div>
            </Link>

            <div className="p-[15px]">
              {product.category ? (
                <div className="font-mono text-[10px] uppercase tracking-[0.12em] text-brand-deep">
                  {product.category.name}
                </div>
              ) : null}
              <h3 className="mb-2.5 mt-1.5 min-h-[39px] text-[15px] font-bold leading-tight text-ink-strong">
                <Link
                  className="transition-colors hover:text-brand-deep"
                  href={`/products/${product.slug}`}
                >
                  {product.name}
                </Link>
              </h3>
              <div className="mb-3 flex items-baseline gap-1.5">
                <span className="whitespace-nowrap text-[18px] font-extrabold tracking-[-0.01em] text-ink-strong">
                  {price}
                </span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono text-[11px] text-ink-faint">
                  {product.variants.length} {copy.variantsSuffix}
                </span>
                <Link
                  className="inline-flex items-center justify-center rounded-field bg-brand-deep px-3.5 py-2 text-[13px] font-bold text-surface-base transition-colors hover:bg-brand-hover focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-accent-sand"
                  href={`/products/${product.slug}`}
                >
                  {copy.viewProduct}
                </Link>
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}
