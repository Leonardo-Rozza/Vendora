import { CatalogExperience } from "@/components/storefront/catalog-experience";
import { listCatalogProductCollection } from "@/lib/commerce/api";
import { toCatalogErrorMessage } from "@/lib/commerce/catalog";
import type { CatalogCollectionResponse } from "@/lib/contracts";

// Fetched per request on the server so the catalog is server-rendered (SEO) and
// the initial HTML is not an empty client shell.
export const dynamic = "force-dynamic";

export default async function Home() {
  let initialCollection: CatalogCollectionResponse | null = null;
  let initialError: string | null = null;

  try {
    initialCollection = await listCatalogProductCollection({ sort: "featured" });
  } catch (error) {
    initialError = toCatalogErrorMessage(error);
  }

  return (
    <main className="app-shell overflow-hidden">
      <section className="mx-auto flex w-full max-w-[88rem] flex-col gap-8 px-6 py-8 sm:px-8 lg:px-12">
        <CatalogExperience
          initialCollection={initialCollection}
          initialError={initialError}
        />
      </section>
    </main>
  );
}
