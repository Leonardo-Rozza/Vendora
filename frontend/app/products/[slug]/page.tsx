import { cache } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProductDetailClient } from "@/components/product/product-detail-client";
import {
  ApiError,
  getCatalogProduct,
  getRelatedProducts,
} from "@/lib/commerce/api";
import type { CatalogProductDetail } from "@/lib/contracts";
import { absoluteUrl } from "@/lib/seo/site";

export const dynamic = "force-dynamic";

// Memoized for the duration of a single request so generateMetadata and the
// page itself share one fetch instead of hitting the backend twice.
const loadProduct = cache((slug: string) => getCatalogProduct(slug));

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;

  try {
    const product = await loadProduct(slug);
    const title = `${product.name} — Vendora`;
    const description = product.description ?? undefined;
    const canonical = `/products/${product.slug}`;
    const primaryImage = product.images[0]?.assetUrl;
    const images = primaryImage ? [primaryImage] : undefined;

    return {
      title,
      description,
      alternates: { canonical },
      openGraph: {
        type: "website",
        title,
        description,
        url: absoluteUrl(canonical),
        images,
      },
      twitter: {
        card: "summary_large_image",
        title,
        description,
        images,
      },
    };
  } catch {
    return { title: "Producto — Vendora" };
  }
}

/**
 * Resolves the lowest-priced variant, used as the product's headline offer in
 * structured data.
 */
function resolvePrimaryOffer(product: CatalogProductDetail) {
  return product.variants.reduce<CatalogProductDetail["variants"][number] | null>(
    (cheapest, variant) => {
      if (!cheapest) {
        return variant;
      }

      return Number(variant.priceAmount) < Number(cheapest.priceAmount)
        ? variant
        : cheapest;
    },
    null,
  );
}

/** Builds schema.org/Product JSON-LD for the product detail page. */
function buildProductJsonLd(product: CatalogProductDetail) {
  const offer = resolvePrimaryOffer(product);
  const hasStock = product.variants.some(
    (variant) =>
      variant.availableQuantity === undefined || variant.availableQuantity > 0,
  );

  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description ?? undefined,
    sku: offer?.sku,
    image: product.images.map((image) => image.assetUrl),
    category: product.category?.name,
    url: absoluteUrl(`/products/${product.slug}`),
    offers: offer
      ? {
          "@type": "Offer",
          price: offer.priceAmount,
          priceCurrency: offer.currencyCode,
          availability: hasStock
            ? "https://schema.org/InStock"
            : "https://schema.org/OutOfStock",
          url: absoluteUrl(`/products/${product.slug}`),
        }
      : undefined,
  };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  // Keep JSX out of the try/catch: only the fetch is guarded. 404 -> notFound;
  // transient failures bubble to the route's error boundary.
  let product: CatalogProductDetail;
  try {
    product = await loadProduct(slug);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      notFound();
    }

    throw error;
  }

  // Related products are best-effort: a failure here must not break the page.
  const related = await getRelatedProducts(slug).catch(() => []);

  const jsonLd = buildProductJsonLd(product);

  return (
    <>
      <script
        type="application/ld+json"
        // Structured data must be raw JSON in the document; this is server-built
        // from typed product data, not user input.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ProductDetailClient product={product} related={related} />
    </>
  );
}
