import { CatalogExperience } from "@/components/storefront/catalog-experience";

export default function Home() {
  return (
    <main className="app-shell overflow-hidden">
      <section className="mx-auto flex w-full max-w-[88rem] flex-col gap-8 px-6 py-8 sm:px-8 lg:px-12">
        <CatalogExperience />
      </section>
    </main>
  );
}
