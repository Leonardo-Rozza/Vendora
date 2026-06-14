import type { MetadataRoute } from "next";
import { listCatalogProductCollection } from "@/lib/commerce/api";
import { absoluteUrl } from "@/lib/seo/site";

// Re-fetched per request: the sitemap should reflect the live catalog.
export const dynamic = "force-dynamic";

const MAX_SITEMAP_PAGES = 50;
const SITEMAP_PAGE_SIZE = 100;

/**
 * Collects every catalog product slug by paging through the collection
 * endpoint. There is no dedicated "list all" route, so we walk the paginated
 * catalog and stop once we have every page (or hit a safety cap).
 */
async function collectProductSlugs(): Promise<string[]> {
  const slugs: string[] = [];

  for (let page = 1; page <= MAX_SITEMAP_PAGES; page += 1) {
    const collection = await listCatalogProductCollection({
      page,
      pageSize: SITEMAP_PAGE_SIZE,
    });

    for (const product of collection.items) {
      slugs.push(product.slug);
    }

    if (page >= collection.pagination.totalPages) {
      break;
    }
  }

  return slugs;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: absoluteUrl("/"),
      lastModified: now,
      changeFrequency: "daily",
      priority: 1,
    },
  ];

  let productRoutes: MetadataRoute.Sitemap = [];

  try {
    const slugs = await collectProductSlugs();
    productRoutes = slugs.map((slug) => ({
      url: absoluteUrl(`/products/${slug}`),
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.8,
    }));
  } catch {
    // Never throw from the sitemap: degrade to the static routes so the file
    // stays valid even when the catalog API is unreachable.
    productRoutes = [];
  }

  return [...staticRoutes, ...productRoutes];
}
