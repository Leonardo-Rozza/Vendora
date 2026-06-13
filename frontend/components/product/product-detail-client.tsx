"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useCommerce } from "@/components/commerce/commerce-provider";
import { formatMoney } from "@/lib/commerce/format";
import type { CatalogProductDetail } from "@/lib/contracts";
import { appCopy } from "@/lib/copy/es-ar";
import { Breadcrumb } from "@/components/ui";

export function ProductDetailClient({
  product,
  related = [],
}: {
  product: CatalogProductDetail;
  related?: CatalogProductDetail[];
}) {
  const { addToCart } = useCommerce();
  const copy = appCopy.productDetail;
  const [selectedVariantId, setSelectedVariantId] = useState<string>(
    product.variants[0]?.id ?? "",
  );
  const [activeImage, setActiveImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [confirmation, setConfirmation] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (toastTimer.current) {
        clearTimeout(toastTimer.current);
      }
    };
  }, []);

  const selectedVariant = useMemo(
    () =>
      product.variants.find((variant) => variant.id === selectedVariantId) ??
      null,
    [product, selectedVariantId],
  );

  if (!selectedVariant) {
    return (
      <main className="mx-auto w-full max-w-4xl px-5 py-12 sm:px-8 lg:px-12">
        <div className="rounded-panel border border-warning-line bg-warning-surface p-8 text-ink-strong shadow-strong">
          <p className="font-semibold">{copy.temporaryError}</p>
          <Link
            className="mt-6 inline-flex rounded-field border-2 border-line-strong px-5 py-3 text-sm font-bold text-brand-deep transition-colors hover:border-brand-deep hover:bg-surface-base"
            href="/"
          >
            {copy.backToCatalog}
          </Link>
        </div>
      </main>
    );
  }

  const primaryImage = product.images[0] ?? null;
  const activeImageRef = product.images[activeImage] ?? primaryImage;
  const stockCopy = describeVariantStock(selectedVariant.availableQuantity, copy);
  const stockTone = describeStockTone(selectedVariant.availableQuantity);
  const isSelectedVariantUnavailable =
    selectedVariant.availableQuantity !== undefined &&
    selectedVariant.availableQuantity <= 0;

  const maxQuantity =
    selectedVariant.availableQuantity !== undefined &&
    selectedVariant.availableQuantity > 0
      ? Math.min(selectedVariant.availableQuantity, 99)
      : 99;

  // Clamp during render so switching to a lower-stock variant never lets the
  // displayed/added quantity exceed what's available.
  const effectiveQuantity = Math.min(quantity, maxQuantity);

  return (
    <main className="mx-auto w-full max-w-[1240px] px-5 py-6 sm:px-8 sm:py-8">
      {product.category ? (
        <Breadcrumb
          className="mb-5"
          items={[
            { label: "Inicio", href: "/" },
            {
              label: product.category.name,
              href: `/?category=${encodeURIComponent(product.category.slug)}`,
            },
            { label: product.name },
          ]}
        />
      ) : null}

      {/* MAIN: gallery + info */}
      <div className="flex flex-col gap-10 lg:flex-row lg:items-start">
        {/* GALLERY */}
        <div className="w-full lg:flex-1 lg:sticky lg:top-24">
          <div className="relative aspect-square overflow-hidden rounded-[20px] bg-[linear-gradient(160deg,rgba(210,120,55,0.24),rgba(24,80,104,0.16))]">
            {activeImageRef ? (
              <Image
                alt={activeImageRef.altText ?? product.name}
                className="object-cover"
                fill
                priority
                sizes="(min-width: 1024px) 50vw, 100vw"
                src={activeImageRef.assetUrl}
              />
            ) : (
              <div className="flex h-full items-end p-6 font-mono text-xs uppercase tracking-[0.18em] text-ink-faint">
                {copy.imagePending}
              </div>
            )}
          </div>
          {product.images.length > 1 ? (
            <div className="mt-3.5 flex flex-wrap gap-3">
              {product.images.map((image, index) => {
                const isActive = index === activeImage;

                return (
                  <button
                    aria-label={image.altText ?? `${product.name} ${index + 1}`}
                    aria-pressed={isActive}
                    className={`relative h-[72px] w-[72px] overflow-hidden rounded-[12px] border-2 bg-surface-sand transition-colors ${
                      isActive ? "border-brand-deep" : "border-line-soft"
                    }`}
                    key={image.id}
                    onClick={() => setActiveImage(index)}
                    type="button"
                  >
                    <Image
                      alt={image.altText ?? product.name}
                      className="object-cover"
                      fill
                      sizes="72px"
                      src={image.assetUrl}
                    />
                  </button>
                );
              })}
            </div>
          ) : null}
        </div>

        {/* INFO */}
        <div className="w-full lg:flex-1">
          <p className="mb-2.5 font-mono text-xs uppercase tracking-[0.16em] text-brand-deep">
            {product.category ? product.category.name : copy.detailEyebrow}
          </p>
          <h1 className="mb-3 text-[clamp(26px,4vw,36px)] font-extrabold leading-[1.08] tracking-[-0.025em] text-ink-strong">
            {product.name}
          </h1>

          <div className="mb-[18px] flex flex-wrap items-center gap-2.5">
            <span
              className={`rounded-[7px] px-2.5 py-[5px] text-xs font-bold ${stockTone}`}
            >
              {stockCopy}
            </span>
            <span className="font-mono text-xs text-ink-soft">
              {copy.variantSku} {selectedVariant.sku}
            </span>
          </div>

          <div className="mb-1.5 flex flex-wrap items-baseline gap-3">
            <span className="text-[34px] font-extrabold tracking-[-0.02em] whitespace-nowrap text-ink-strong">
              {formatMoney(
                selectedVariant.priceAmount,
                selectedVariant.currencyCode,
              )}
            </span>
          </div>

          <p className="mb-6 mt-5 max-w-[50ch] text-[15.5px] leading-[1.6] text-ink-muted">
            {product.description ??
              "Producto listo para sumarse al flujo de compra de la tienda."}
          </p>

          {/* variant selector */}
          {product.variants.length > 1 ? (
            <div className="mb-6">
              <div className="mb-[11px] flex items-center justify-between">
                <span className="text-[13.5px] font-bold text-ink-strong">
                  {copy.chooseVariant}
                </span>
                <span className="text-[13.5px] text-ink-muted">
                  {selectedVariant.name}
                </span>
              </div>
              <div className="flex flex-wrap gap-3">
                {product.variants.map((variant) => {
                  const isSelected = variant.id === selectedVariantId;

                  return (
                    <button
                      aria-label={variant.name}
                      aria-pressed={isSelected}
                      className={`flex items-center gap-2.5 rounded-field border-[1.5px] bg-surface-panel px-3.5 py-2 text-left transition-colors ${
                        isSelected
                          ? "border-brand-deep shadow-[inset_0_0_0_1px_var(--brand-deep)]"
                          : "border-line-strong hover:border-brand-deep"
                      }`}
                      key={variant.id}
                      onClick={() => setSelectedVariantId(variant.id)}
                      type="button"
                    >
                      <span className="text-sm font-semibold text-ink-strong">
                        {variant.name}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : null}

          {/* quantity + add to cart */}
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <div className="flex items-center overflow-hidden rounded-[12px] border-[1.5px] border-line-strong bg-surface-panel">
              <button
                aria-label="Restar"
                className="h-[50px] w-[46px] text-[22px] leading-none text-brand-deep disabled:text-ink-faint"
                disabled={effectiveQuantity <= 1}
                onClick={() => setQuantity(Math.max(1, effectiveQuantity - 1))}
                type="button"
              >
                –
              </button>
              <span
                aria-live="polite"
                className="min-w-10 text-center text-[17px] font-bold text-ink-strong"
              >
                {effectiveQuantity}
              </span>
              <button
                aria-label="Sumar"
                className="h-[50px] w-[46px] text-[22px] leading-none text-brand-deep disabled:text-ink-faint"
                disabled={effectiveQuantity >= maxQuantity}
                onClick={() =>
                  setQuantity(Math.min(maxQuantity, effectiveQuantity + 1))
                }
                type="button"
              >
                +
              </button>
            </div>
            <button
              className="min-w-[200px] flex-1 rounded-[12px] bg-brand-deep px-6 py-[15px] text-base font-bold text-surface-base transition-colors hover:bg-brand-hover outline-none focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-accent-sand disabled:cursor-not-allowed disabled:bg-surface-sand disabled:text-ink-faint"
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
                  quantity: effectiveQuantity,
                });
                setConfirmation(
                  `${product.name} (${selectedVariant.name}) ${copy.addedToCart}.`,
                );
                if (toastTimer.current) {
                  clearTimeout(toastTimer.current);
                }
                toastTimer.current = setTimeout(
                  () => setConfirmation(null),
                  2800,
                );
              }}
              type="button"
            >
              {isSelectedVariantUnavailable ? copy.unavailableCta : copy.addToCart}
            </button>
          </div>
          <Link
            className="mb-6 block rounded-[12px] bg-accent-sand px-6 py-[15px] text-center text-base font-bold text-brand-ink transition-colors hover:brightness-95"
            href="/cart"
          >
            {copy.goToCart}
          </Link>

          {/* trust mini */}
          <div className="rounded-[14px] border border-line-soft bg-surface-panel px-1 py-1.5">
            {TRUST_SIGNALS.map((signal, index) => (
              <div
                className={`flex items-center gap-3 px-3.5 py-[11px] ${
                  index < TRUST_SIGNALS.length - 1
                    ? "border-b border-surface-muted"
                    : ""
                }`}
                key={signal.title}
              >
                <span aria-hidden className="text-[17px]">
                  {signal.icon}
                </span>
                <div>
                  <div className="text-sm font-bold text-ink-strong">
                    {signal.title}
                  </div>
                  <div className="text-[12.5px] text-ink-soft">
                    {signal.subtitle}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* SPECS */}
      {product.attributes.length > 0 ? (
        <section className="pt-14">
          <h2 className="mb-5 text-2xl font-extrabold tracking-[-0.02em] text-ink-strong">
            {copy.specificationsTitle}
          </h2>
          <dl className="grid overflow-hidden rounded-card border border-line-soft bg-surface-panel sm:grid-cols-2">
            {product.attributes.map((attribute) => (
              <div
                className="flex items-baseline justify-between gap-4 border-b border-surface-muted px-5 py-3.5"
                key={`${attribute.attributeId}-${attribute.valueSlug}`}
              >
                <dt className="text-sm text-ink-soft">{attribute.attributeName}</dt>
                <dd className="text-right text-sm font-semibold text-ink-strong">
                  {attribute.value}
                </dd>
              </div>
            ))}
          </dl>
        </section>
      ) : null}

      {/* RELATED */}
      {related.length > 0 ? (
        <section className="pt-14">
          <h2 className="mb-5 text-2xl font-extrabold tracking-[-0.02em] text-ink-strong">
            Productos relacionados
          </h2>
          <div className="grid grid-cols-2 gap-[18px] lg:grid-cols-4">
            {related.map((item) => {
              const image = item.images[0] ?? null;
              const firstVariant = item.variants[0] ?? null;

              return (
                <Link
                  className="group block overflow-hidden rounded-card border border-line-soft bg-surface-panel transition duration-200 hover:-translate-y-[3px] hover:border-accent-sand hover:shadow-medium"
                  href={`/products/${item.slug}`}
                  key={item.id}
                >
                  <div className="relative aspect-square bg-[linear-gradient(160deg,rgba(210,120,55,0.18),rgba(24,80,104,0.12))]">
                    {image ? (
                      <Image
                        alt={image.altText ?? item.name}
                        className="object-cover"
                        fill
                        sizes="(min-width: 1024px) 20vw, 50vw"
                        src={image.assetUrl}
                      />
                    ) : null}
                  </div>
                  <div className="p-[15px]">
                    {item.category ? (
                      <div className="font-mono text-[10px] uppercase tracking-[0.12em] text-brand-deep">
                        {item.category.name}
                      </div>
                    ) : null}
                    <div className="mb-2 mt-1.5 min-h-[39px] text-[15px] font-bold leading-[1.3] text-ink-strong">
                      {item.name}
                    </div>
                    {firstVariant ? (
                      <span className="whitespace-nowrap text-lg font-extrabold tracking-[-0.01em] text-ink-strong">
                        {formatMoney(
                          firstVariant.priceAmount,
                          firstVariant.currencyCode,
                        )}
                      </span>
                    ) : null}
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      ) : null}

      {/* TOAST confirmation */}
      {confirmation ? (
        <div
          aria-live="polite"
          className="fixed bottom-7 left-1/2 z-90 -translate-x-1/2"
          role="status"
        >
          <div className="flex min-w-[270px] items-center gap-3 rounded-[14px] bg-brand-ink px-[18px] py-3.5 text-[#FBEFD9] shadow-strong">
            <span className="grid h-6 w-6 flex-shrink-0 place-items-center rounded-full bg-success-ink text-[13px] text-white">
              ✓
            </span>
            <div className="flex-1">
              <div className="text-[14.5px] font-bold">Agregado al carrito</div>
              <div className="text-[12.5px] text-accent-sky">{confirmation}</div>
            </div>
            <Link
              className="text-[13px] font-bold text-accent-sand"
              href="/cart"
            >
              Ver →
            </Link>
          </div>
        </div>
      ) : null}
    </main>
  );
}

const TRUST_SIGNALS = [
  {
    icon: "🚚",
    title: "Llega en 24–72 hs",
    subtitle: "Envío a CABA y AMBA",
  },
  {
    icon: "🔒",
    title: "Pago protegido",
    subtitle: "Mercado Pago · cifrado",
  },
  {
    icon: "↩️",
    title: "Devolución gratis",
    subtitle: "10 días corridos",
  },
] as const;

function describeStockTone(availableQuantity: number | undefined) {
  if (availableQuantity === undefined) {
    return "bg-[#e0eaed] text-[#21505f]";
  }

  if (availableQuantity <= 0) {
    return "bg-danger-surface text-danger-ink";
  }

  if (availableQuantity <= 3) {
    return "bg-warning-surface text-warning-line";
  }

  return "bg-success-surface text-success-ink";
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
