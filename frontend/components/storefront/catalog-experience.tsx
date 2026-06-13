"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { normalizeCatalogProductCard, listCatalogProductCollection } from "@/lib/commerce/api";
import {
  appliedAttributesToCompact,
  toCatalogErrorMessage,
  toggleAttributeValue,
} from "@/lib/commerce/catalog";
import type {
  CatalogCollectionResponse,
  CatalogFilters,
  CatalogProductCard,
  CategoryNode,
} from "@/lib/contracts";
import { appCopy } from "@/lib/copy/es-ar";
import { CatalogFilters as CatalogFiltersPanel } from "@/components/storefront/catalog-filters";
import { CatalogGrid } from "@/components/storefront/catalog-grid";
import { CatalogToolbar } from "@/components/storefront/catalog-toolbar";
import { Button } from "@/components/ui/button";
import { Pagination } from "@/components/ui/pagination";
import { Pill } from "@/components/ui/pill";

const DEFAULT_FILTERS: CatalogFilters = {
  query: "",
  sort: "featured",
};

function mapAppliedFilters(
  applied: CatalogCollectionResponse["filters"]["applied"],
): CatalogFilters {
  return {
    query: applied.query ?? "",
    category: applied.category ?? undefined,
    minPriceAmount: applied.minPriceAmount ?? "",
    maxPriceAmount: applied.maxPriceAmount ?? "",
    sort: applied.sort,
    attributes: appliedAttributesToCompact(applied.attributes),
  };
}

export function CatalogExperience({
  initialCollection = null,
  initialError = null,
  initialCategoryTree = [],
}: {
  initialCollection?: CatalogCollectionResponse | null;
  initialError?: string | null;
  initialCategoryTree?: CategoryNode[];
}) {
  const copy = appCopy.storefrontCatalog;
  const initialAppliedFilters = initialCollection
    ? mapAppliedFilters(initialCollection.filters.applied)
    : DEFAULT_FILTERS;
  const [collection, setCollection] = useState<CatalogCollectionResponse | null>(
    initialCollection,
  );
  const [products, setProducts] = useState<CatalogProductCard[]>(
    initialCollection
      ? initialCollection.items.map(normalizeCatalogProductCard)
      : [],
  );
  const [draftFilters, setDraftFilters] = useState<CatalogFilters>(initialAppliedFilters);
  const [activeFilters, setActiveFilters] = useState<CatalogFilters>(initialAppliedFilters);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(initialError);
  const gridRef = useRef<HTMLDivElement | null>(null);

  async function loadProducts(
    nextFilters: CatalogFilters,
    options: { scrollToGrid?: boolean } = {},
  ) {
    setIsLoading(true);
    setError(null);

    try {
      const nextCollection = await listCatalogProductCollection(nextFilters);
      setCollection(nextCollection);
      setProducts(nextCollection.items.map(normalizeCatalogProductCard));
      const appliedFilters = mapAppliedFilters(nextCollection.filters.applied);
      setActiveFilters(appliedFilters);
      setDraftFilters(appliedFilters);
      if (options.scrollToGrid) {
        gridRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    } catch (caughtError) {
      setError(toCatalogErrorMessage(caughtError));
      setProducts([]);
    } finally {
      setIsLoading(false);
    }
  }

  function handlePageChange(nextPage: number) {
    void loadProducts(
      { ...activeFilters, page: nextPage },
      { scrollToGrid: true },
    );
  }

  function handleAttributeToggle(attributeSlug: string, valueSlug: string) {
    setDraftFilters((current) => ({
      ...current,
      attributes: toggleAttributeValue(
        current.attributes,
        attributeSlug,
        valueSlug,
      ),
    }));
  }

  useEffect(() => {
    // The server component already provided the initial catalog (SSR/SEO); only
    // fetch on mount if it could not, so the page stays resilient.
    if (!initialCollection && !initialError) {
      void loadProducts(DEFAULT_FILTERS);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const appliedAttributes = useMemo(
    () => collection?.filters.applied.attributes ?? [],
    [collection],
  );

  const attributeNameBySlug = useMemo(() => {
    const map = new Map<string, string>();
    for (const facet of collection?.filters.attributes ?? []) {
      map.set(facet.slug, facet.name);
    }
    return map;
  }, [collection]);

  const activeFilterCount = useMemo(() => {
    return (
      [
        activeFilters.query,
        activeFilters.category,
        activeFilters.minPriceAmount,
        activeFilters.maxPriceAmount,
      ].filter(Boolean).length +
      appliedAttributes.reduce((total, entry) => total + entry.values.length, 0)
    );
  }, [activeFilters, appliedAttributes]);

  const categoryFacets = useMemo(
    () => collection?.filters.categories ?? [],
    [collection],
  );

  const categoryNameBySlug = useMemo(() => {
    const map = new Map<string, string>();
    for (const facet of categoryFacets) {
      map.set(facet.slug, facet.name);
    }
    return map;
  }, [categoryFacets]);

  function resolveCategoryName(slug: string) {
    return categoryNameBySlug.get(slug) ?? slug;
  }

  const activeLabel = useMemo(() => {
    if (activeFilters.category) {
      return resolveCategoryName(activeFilters.category);
    }

    if (activeFilters.query) {
      return `Busqueda: ${activeFilters.query}`;
    }

    return copy.allProducts;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeFilters.category, activeFilters.query, copy.allProducts, categoryNameBySlug]);

  const resultLabel = useMemo(() => {
    const total = collection?.pagination.total ?? products.length;
    return `${total} ${total === 1 ? "producto" : "productos"}`;
  }, [collection, products.length]);

  function applyDraftFilters() {
    void loadProducts({
      ...draftFilters,
      query: draftFilters.query?.trim() ?? "",
      minPriceAmount: draftFilters.minPriceAmount?.trim() ?? "",
      maxPriceAmount: draftFilters.maxPriceAmount?.trim() ?? "",
      page: 1,
    });
    setIsFiltersOpen(false);
  }

  function handleQuickCategory(category?: string) {
    const nextFilters = {
      ...draftFilters,
      category,
    } satisfies CatalogFilters;
    setDraftFilters(nextFilters);
    void loadProducts(nextFilters);
  }

  function clearFilters() {
    setDraftFilters(DEFAULT_FILTERS);
    void loadProducts(DEFAULT_FILTERS);
  }

  function scrollToGrid() {
    gridRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <div className="grid gap-6">
      <section
        className="overflow-hidden rounded-[22px] bg-brand-ink"
        id="categorias"
      >
        <div className="flex flex-wrap items-stretch">
          <div className="min-w-[260px] flex-1 p-[clamp(28px,4vw,48px)]">
            <p className="mb-3.5 font-mono text-xs uppercase tracking-[0.18em] text-accent-sand">
              {copy.heroEyebrow}
            </p>
            <h1 className="mb-3.5 max-w-[16ch] text-[clamp(28px,4.4vw,44px)] font-extrabold leading-[1.05] tracking-[-0.025em] text-[#FBEFD9]">
              {copy.heroTitle}
            </h1>
            <p className="mb-6 max-w-[42ch] text-base leading-relaxed text-[#C9D6DB]">
              {copy.heroDescription}
            </p>
            <div className="flex flex-wrap gap-3">
              <button
                className="rounded-[12px] bg-accent-sand px-6 py-3.5 text-[15px] font-bold text-brand-ink transition-colors hover:bg-[#cba87f] focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-accent-sand"
                onClick={scrollToGrid}
                type="button"
              >
                {copy.heroPrimaryCta}
              </button>
              <a
                className="rounded-[12px] border-[1.5px] border-[rgba(216,182,144,0.45)] px-6 py-[13px] text-[15px] font-bold text-[#FBEFD9] transition-colors hover:bg-[rgba(216,182,144,0.12)]"
                href="#vd-grid-top"
              >
                {copy.heroSecondaryCta}
              </a>
            </div>
          </div>
          <div
            className="relative grid min-h-[240px] min-w-[240px] flex-1 place-items-center"
            style={{
              background:
                "repeating-linear-gradient(45deg, #21505F, #21505F 12px, #1d4655 12px, #1d4655 24px)",
            }}
          >
            <span className="font-mono text-xs tracking-[0.1em] text-[rgba(216,182,144,0.6)]">
              [ lifestyle / hero ]
            </span>
          </div>
        </div>
      </section>

      <CatalogToolbar
        activeFilterCount={activeFilterCount}
        activeLabel={activeLabel}
        resultLabel={resultLabel}
        filters={draftFilters}
        isLoading={isLoading}
        onQueryChange={(value) =>
          setDraftFilters((current) => ({ ...current, query: value }))
        }
        onSortChange={(value) => {
          const nextSort = value ?? "featured";
          setDraftFilters((current) => ({ ...current, sort: nextSort }));
          void loadProducts({ ...activeFilters, sort: nextSort, page: 1 });
        }}
        onSubmit={applyDraftFilters}
        onToggleFilters={() => setIsFiltersOpen((current) => !current)}
        showFilters={isFiltersOpen}
      />

      <div
        className="grid items-start gap-7 lg:grid-cols-[250px_minmax(0,1fr)]"
        id="explorar"
      >
        <aside className="hidden self-start lg:sticky lg:top-[150px] lg:block">
          <CatalogFiltersPanel
            activeFilterCount={activeFilterCount}
            filters={draftFilters}
            metadata={collection?.filters ?? null}
            onApply={applyDraftFilters}
            onClear={clearFilters}
            onCategoryChange={(category) =>
              setDraftFilters((current) => ({ ...current, category }))
            }
            onMaxPriceChange={(value) =>
              setDraftFilters((current) => ({ ...current, maxPriceAmount: value }))
            }
            onMinPriceChange={(value) =>
              setDraftFilters((current) => ({ ...current, minPriceAmount: value }))
            }
            onAttributeToggle={handleAttributeToggle}
          />
        </aside>

        <div className="min-w-0 space-y-4" ref={gridRef}>
          <div className="lg:hidden">
            <CatalogFiltersPanel
              activeFilterCount={activeFilterCount}
              filters={draftFilters}
              metadata={collection?.filters ?? null}
              onApply={applyDraftFilters}
              onClear={clearFilters}
              onCategoryChange={(category) =>
                setDraftFilters((current) => ({ ...current, category }))
              }
              onMaxPriceChange={(value) =>
                setDraftFilters((current) => ({ ...current, maxPriceAmount: value }))
              }
              onMinPriceChange={(value) =>
                setDraftFilters((current) => ({ ...current, minPriceAmount: value }))
              }
              onAttributeToggle={handleAttributeToggle}
              visible={isFiltersOpen}
            />
          </div>

          {activeFilterCount > 0 ? (
            <div className="flex flex-wrap items-center gap-2">
              {activeFilters.category ? (
                <Pill>{resolveCategoryName(activeFilters.category)}</Pill>
              ) : null}
              {activeFilters.query ? <Pill>Busqueda: {activeFilters.query}</Pill> : null}
              {activeFilters.minPriceAmount ? (
                <Pill>Min: {activeFilters.minPriceAmount}</Pill>
              ) : null}
              {activeFilters.maxPriceAmount ? (
                <Pill>Max: {activeFilters.maxPriceAmount}</Pill>
              ) : null}
              {appliedAttributes.flatMap((entry) =>
                entry.values.map((value) => (
                  <Pill key={`${entry.slug}:${value}`}>
                    {attributeNameBySlug.get(entry.slug) ?? entry.slug}: {value}
                  </Pill>
                )),
              )}
              <Button onClick={clearFilters} size="sm" variant="ghost">
                {copy.clearFilters}
              </Button>
            </div>
          ) : null}

          <CatalogGrid
            error={error}
            isLoading={isLoading}
            onClearFilters={clearFilters}
            onRetry={() => void loadProducts(activeFilters)}
            products={products}
          />

          {collection && collection.pagination.totalPages > 1 ? (
            <div className="flex justify-center pt-3">
              <Pagination
                page={collection.pagination.page}
                pageCount={collection.pagination.totalPages}
                onPageChange={handlePageChange}
              />
            </div>
          ) : null}
        </div>
      </div>

      {initialCategoryTree.length > 0 ? (
        <CategoryTreeNav
          tree={initialCategoryTree}
          activeSlug={activeFilters.category}
          onSelect={handleQuickCategory}
        />
      ) : null}
    </div>
  );
}

function CategoryTreeNav({
  tree,
  activeSlug,
  onSelect,
}: {
  tree: CategoryNode[];
  activeSlug?: string;
  onSelect: (slug?: string) => void;
}) {
  return (
    <nav
      aria-label="Categorias"
      className="rounded-card border border-line-soft bg-surface-panel p-5"
    >
      <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-ink-soft">
        {appCopy.storefrontHeader.categories}
      </p>
      <ul className="mt-4 grid gap-1 sm:grid-cols-2 lg:grid-cols-3">
        {tree.map((node) => (
          <CategoryTreeItem
            key={node.id}
            node={node}
            activeSlug={activeSlug}
            onSelect={onSelect}
          />
        ))}
      </ul>
    </nav>
  );
}

function CategoryTreeItem({
  node,
  activeSlug,
  onSelect,
  depth = 0,
}: {
  node: CategoryNode;
  activeSlug?: string;
  onSelect: (slug?: string) => void;
  depth?: number;
}) {
  return (
    <li>
      <button
        className="chip-button w-full rounded-[0.9rem] px-3 py-2 text-left text-sm font-medium text-ink-strong"
        data-active={activeSlug === node.slug}
        onClick={() => onSelect(node.slug)}
        style={{ paddingLeft: `${0.75 + depth * 1}rem` }}
        type="button"
      >
        {node.name}
      </button>
      {node.children.length > 0 ? (
        <ul className="grid gap-1">
          {node.children.map((child) => (
            <CategoryTreeItem
              key={child.id}
              node={child}
              activeSlug={activeSlug}
              onSelect={onSelect}
              depth={depth + 1}
            />
          ))}
        </ul>
      ) : null}
    </li>
  );
}
