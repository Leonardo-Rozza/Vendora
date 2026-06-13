import { cache } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProductDetailClient } from "@/components/product/product-detail-client";
import { ApiError, getCatalogProduct } from "@/lib/commerce/api";
import type { CatalogProductDetail } from "@/lib/contracts";

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
    return {
      title: `${product.name} — Vendora`,
      description: product.description ?? undefined,
    };
  } catch {
    return { title: "Producto — Vendora" };
  }
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

  return <ProductDetailClient product={product} />;
}
