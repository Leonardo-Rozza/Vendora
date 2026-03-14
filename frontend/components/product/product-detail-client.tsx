"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useCommerce } from "@/components/commerce/commerce-provider";
import { ApiError, getCatalogProduct } from "@/lib/commerce/api";
import { formatMoney } from "@/lib/commerce/format";
import type { CatalogProductDetail } from "@/lib/contracts";
import { appCopy, getProductCategoryLabel } from "@/lib/copy/es-ar";

export function ProductDetailClient({ slug }: { slug: string }) {
  const { addToCart } = useCommerce();
  const copy = appCopy.productDetail;
  const [product, setProduct] = useState<CatalogProductDetail | null>(null);
  const [selectedVariantId, setSelectedVariantId] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isMissing, setIsMissing] = useState(false);
  const [confirmation, setConfirmation] = useState<string | null>(null);

  useEffect(() => {
    let isActive = true;

    async function loadProduct() {
      setIsLoading(true);
      setError(null);
      setIsMissing(false);

      try {
        const nextProduct = await getCatalogProduct(slug);

        if (!isActive) {
          return;
        }

        setProduct(nextProduct);
        setSelectedVariantId(nextProduct.variants[0]?.id ?? "");
      } catch (caughtError) {
        if (!isActive) {
          return;
        }

        if (caughtError instanceof ApiError && caughtError.status === 404) {
          setIsMissing(true);
        } else {
          setError(caughtError instanceof Error ? caughtError.message : copy.temporaryError);
        }
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    }

    void loadProduct();

    return () => {
      isActive = false;
    };
  }, [copy.temporaryError, slug]);

  const selectedVariant = useMemo(
    () => product?.variants.find((variant) => variant.id === selectedVariantId) ?? null,
    [product, selectedVariantId],
  );

  if (isLoading) {
    return (
      <section className="mx-auto w-full max-w-7xl px-6 py-10 sm:px-8 lg:px-12">
        <div className="grid animate-pulse gap-6 lg:grid-cols-[1.02fr_0.98fr]">
          <div className="min-h-[24rem] rounded-[2rem] bg-white/70" />
          <div className="min-h-[24rem] rounded-[2rem] bg-white/70" />
        </div>
      </section>
    );
  }

  if (isMissing) {
    return (
      <main className="mx-auto w-full max-w-4xl px-6 py-12 sm:px-8 lg:px-12">
        <div className="rounded-[2rem] border border-[var(--line-soft)] bg-white/78 p-8 shadow-[0_20px_70px_rgba(61,43,28,0.08)]">
          <p className="font-mono text-xs uppercase tracking-[0.34em] text-[var(--ink-soft)]">
            {copy.missingEyebrow}
          </p>
          <h1 className="mt-4 text-4xl font-semibold tracking-[-0.05em] text-[var(--ink-strong)]">
            {copy.missingTitle}
          </h1>
          <p className="mt-4 text-sm leading-7 text-[var(--ink-muted)]">{copy.missingDescription}</p>
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

  if (error || !product || !selectedVariant) {
    return (
      <main className="mx-auto w-full max-w-4xl px-6 py-12 sm:px-8 lg:px-12">
        <div className="rounded-[2rem] border border-[var(--warning-line)] bg-[var(--warning-surface)] p-8 text-[var(--ink-strong)] shadow-[0_20px_70px_rgba(61,43,28,0.08)]">
          <p className="font-semibold">{copy.temporaryError}</p>
          <p className="mt-3 text-sm leading-7 text-[var(--ink-muted)]">{error}</p>
          <Link className="mt-6 inline-flex rounded-full border border-[var(--line-strong)] px-5 py-3 text-sm font-semibold" href="/">
            {copy.backToCatalog}
          </Link>
        </div>
      </main>
    );
  }

  const primaryImage = product.images[0] ?? null;
  const stockCopy = describeVariantStock(selectedVariant.availableQuantity, copy);
  const isSelectedVariantUnavailable =
    selectedVariant.availableQuantity !== undefined && selectedVariant.availableQuantity <= 0;

  return (
    <main className="mx-auto w-full max-w-7xl px-6 py-10 sm:px-8 lg:px-12">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4 text-sm text-[var(--ink-muted)]">
        <div className="flex flex-wrap items-center gap-3">
          <Link href="/">{copy.backToCatalog}</Link>
          <span>•</span>
          <Link href="/cart">{copy.reviewCart}</Link>
        </div>
        {product.category ? (
          <span className="rounded-full border border-[var(--line-soft)] bg-white/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-[var(--brand-deep)]">
            {copy.categoryLabel}: {getProductCategoryLabel(product.category)}
          </span>
        ) : null}
      </div>

      <section className="grid gap-6 lg:grid-cols-[1.02fr_0.98fr]">
        <article className="overflow-hidden rounded-[2rem] border border-[var(--line-soft)] bg-white/78 shadow-[0_20px_70px_rgba(61,43,28,0.08)]">
          <div className="aspect-[1/1] bg-[linear-gradient(160deg,rgba(210,120,55,0.24),rgba(24,80,104,0.16))]">
            {primaryImage ? (
              <img alt={primaryImage.altText ?? product.name} className="h-full w-full object-cover" src={primaryImage.assetUrl} />
            ) : (
              <div className="flex h-full items-end p-6 font-mono text-xs uppercase tracking-[0.28em] text-[var(--ink-strong)]">
                {copy.imagePending}
              </div>
            )}
          </div>
          {product.images.length > 1 ? (
            <div className="grid gap-3 border-t border-[var(--line-soft)] p-4 sm:grid-cols-3">
              {product.images.slice(1).map((image) => (
                <div key={image.id} className="overflow-hidden rounded-[1.2rem] border border-[var(--line-soft)]">
                  <img alt={image.altText ?? product.name} className="aspect-[4/3] h-full w-full object-cover" src={image.assetUrl} />
                </div>
              ))}
            </div>
          ) : null}
        </article>

        <article className="rounded-[2rem] border border-[var(--line-soft)] bg-[var(--surface-panel)] p-8 shadow-[0_20px_70px_rgba(61,43,28,0.08)]">
          <p className="font-mono text-xs uppercase tracking-[0.32em] text-[var(--brand-deep)]">{copy.detailEyebrow}</p>
          <h1 className="mt-4 text-4xl font-semibold tracking-[-0.05em] text-[var(--ink-strong)]">{product.name}</h1>
          <p className="mt-5 text-base leading-8 text-[var(--ink-muted)]">
            {product.description ?? "Producto listo para sumarse al flujo de compra de la tienda."}
          </p>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <div className="rounded-[1.4rem] border border-[var(--line-soft)] bg-white/75 p-4">
              <p className="text-xs uppercase tracking-[0.22em] text-[var(--ink-soft)]">{copy.selectedPrice}</p>
              <p className="mt-2 text-lg font-semibold text-[var(--ink-strong)]">
                {formatMoney(selectedVariant.priceAmount, selectedVariant.currencyCode)}
              </p>
            </div>
            <div className="rounded-[1.4rem] border border-[var(--line-soft)] bg-white/75 p-4">
              <p className="text-xs uppercase tracking-[0.22em] text-[var(--ink-soft)]">{copy.variantSku}</p>
              <p className="mt-2 text-lg font-semibold text-[var(--ink-strong)]">{selectedVariant.sku}</p>
            </div>
            <div className="rounded-[1.4rem] border border-[var(--line-soft)] bg-white/75 p-4">
              <p className="text-xs uppercase tracking-[0.22em] text-[var(--ink-soft)]">{copy.stockLabel}</p>
              <p className="mt-2 text-sm font-semibold text-[var(--ink-strong)]">{stockCopy}</p>
            </div>
          </div>

          <div className="mt-8 rounded-[1.6rem] border border-[var(--line-soft)] bg-white/75 p-5">
            <p className="font-mono text-xs uppercase tracking-[0.28em] text-[var(--ink-soft)]">{copy.chooseVariant}</p>
            <div className="mt-4 grid gap-3">
              {product.variants.map((variant) => {
                const isSelected = variant.id === selectedVariantId;
                const variantStock = describeVariantStock(variant.availableQuantity, copy);

                return (
                  <button
                    key={variant.id}
                    className={`rounded-[1.2rem] border px-4 py-4 text-left transition ${
                      isSelected
                        ? "border-[var(--brand-deep)] bg-[rgba(140,75,38,0.08)]"
                        : "border-[var(--line-soft)] bg-[var(--surface-panel)] hover:bg-white"
                    }`}
                    onClick={() => setSelectedVariantId(variant.id)}
                    type="button"
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <span className="block font-semibold text-[var(--ink-strong)]">{variant.name}</span>
                        <span className="mt-1 block text-xs uppercase tracking-[0.22em] text-[var(--ink-soft)]">{variant.sku}</span>
                      </div>
                      <div className="text-left sm:text-right">
                        <span className="block text-sm font-semibold text-[var(--ink-strong)]">
                          {formatMoney(variant.priceAmount, variant.currencyCode)}
                        </span>
                        <span className="mt-1 block text-xs text-[var(--ink-muted)]">{variantStock}</span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-8 flex flex-col gap-4 rounded-[1.6rem] border border-[var(--line-soft)] bg-[linear-gradient(180deg,rgba(26,58,73,0.96),rgba(18,39,52,0.98))] p-6 text-[var(--surface-base)]">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="font-mono text-xs uppercase tracking-[0.28em] text-[var(--accent-sand)]">{copy.selectedPrice}</p>
                <p className="mt-2 text-3xl font-semibold tracking-[-0.04em]">
                  {formatMoney(selectedVariant.priceAmount, selectedVariant.currencyCode)}
                </p>
              </div>
              <Link className="text-sm font-semibold text-white/76 underline-offset-4 hover:underline" href="/cart">
                {copy.goToCart}
              </Link>
            </div>
            <button
              className="rounded-full bg-[var(--surface-base)] px-5 py-3 text-sm font-semibold text-[var(--ink-strong)] transition-transform hover:-translate-y-0.5 disabled:translate-y-0 disabled:opacity-55"
              disabled={isSelectedVariantUnavailable}
              onClick={() => {
                addToCart({
                  variantId: selectedVariant.id,
                  sku: selectedVariant.sku,
                  productId: product.id,
                  productSlug: product.slug,
                  productName: product.name,
                  variantName: selectedVariant.name,
                  unitPriceAmount: selectedVariant.priceAmount,
                  currencyCode: selectedVariant.currencyCode,
                  imageUrl: primaryImage?.assetUrl ?? null,
                  imageAlt: primaryImage?.altText ?? product.name,
                  quantity: 1,
                });
                setConfirmation(`${product.name} (${selectedVariant.name}) ${copy.addedToCart}.`);
              }}
              type="button"
            >
              {isSelectedVariantUnavailable ? copy.unavailableCta : copy.addToCart}
            </button>
            {confirmation ? <p className="text-sm text-white/76">{confirmation}</p> : null}
          </div>
        </article>
      </section>
    </main>
  );
}

function describeVariantStock(
  availableQuantity: number | undefined,
  copy: typeof appCopy.productDetail,
) {
  if (availableQuantity === undefined) {
    return copy.stockUnknown;
  }

  if (availableQuantity <= 0) {
    return copy.stockOut;
  }

  if (availableQuantity <= 3) {
    return `${copy.stockLow} (${availableQuantity})`;
  }

  return `${copy.stockReady} (${availableQuantity})`;
}
