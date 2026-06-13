import { CatalogExperience } from "@/components/storefront/catalog-experience";
import { listCatalogProductCollection, listCategoryTree } from "@/lib/commerce/api";
import { toCatalogErrorMessage } from "@/lib/commerce/catalog";
import type { CatalogCollectionResponse, CategoryNode } from "@/lib/contracts";

// Fetched per request on the server so the catalog is server-rendered (SEO) and
// the initial HTML is not an empty client shell.
export const dynamic = "force-dynamic";

export default async function Home() {
  let initialCollection: CatalogCollectionResponse | null = null;
  let initialError: string | null = null;
  let initialCategoryTree: CategoryNode[] = [];

  try {
    initialCollection = await listCatalogProductCollection({ sort: "featured" });
  } catch (error) {
    initialError = toCatalogErrorMessage(error);
  }

  try {
    initialCategoryTree = await listCategoryTree();
  } catch {
    initialCategoryTree = [];
  }

  return (
    <main className="app-shell">
      <section className="mx-auto w-full max-w-[77.5rem] px-5 py-6 sm:px-6">
        <CatalogExperience
          initialCollection={initialCollection}
          initialError={initialError}
          initialCategoryTree={initialCategoryTree}
        />
      </section>
    </main>
  );
}
