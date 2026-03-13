import { CatalogExperience } from "@/components/storefront/catalog-experience";

export default function Home() {
  return (
    <main className="min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(210,120,55,0.18),_transparent_28%),radial-gradient(circle_at_top_right,_rgba(24,80,104,0.14),_transparent_30%),linear-gradient(180deg,_#f5efe4_0%,_#f2ece1_46%,_#ebe2d3_100%)]">
      <section className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-6 py-8 sm:px-8 lg:px-12">
        <CatalogExperience />
      </section>
    </main>
  );
}
