"use client";

import { useEffect, useMemo, useState } from "react";
import { normalizeCatalogProductCard, listCatalogProductCollection } from "@/lib/commerce/api";
import { toCatalogErrorMessage } from "@/lib/commerce/catalog";
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
import { Panel } from "@/components/ui/panel";
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

  async function loadProducts(nextFilters: CatalogFilters) {
    setIsLoading(true);
    setError(null);

    try {
      const nextCollection = await listCatalogProductCollection(nextFilters);
      setCollection(nextCollection);
      setProducts(nextCollection.items.map(normalizeCatalogProductCard));
      const appliedFilters = mapAppliedFilters(nextCollection.filters.applied);
      setActiveFilters(appliedFilters);
      setDraftFilters(appliedFilters);
    } catch (caughtError) {
      setError(toCatalogErrorMessage(caughtError));
      setProducts([]);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    // The server component already provided the initial catalog (SSR/SEO); only
    // fetch on mount if it could not, so the page stays resilient.
    if (!initialCollection && !initialError) {
      void loadProducts(DEFAULT_FILTERS);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const activeFilterCount = useMemo(() => {
    return [
      activeFilters.query,
      activeFilters.category,
      activeFilters.minPriceAmount,
      activeFilters.maxPriceAmount,
    ].filter(Boolean).length;
  }, [activeFilters]);

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

  function applyDraftFilters() {
    void loadProducts({
      ...draftFilters,
      query: draftFilters.query?.trim() ?? "",
      minPriceAmount: draftFilters.minPriceAmount?.trim() ?? "",
      maxPriceAmount: draftFilters.maxPriceAmount?.trim() ?? "",
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

  return (
    <section className="grid gap-6" id="explorar">
      <article className="glass-panel rounded-[2rem] p-6 sm:p-8">
        <div className="grid gap-8 xl:grid-cols-[1.05fr_0.95fr] xl:items-start">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.34em] text-[var(--ink-soft)]">
              {copy.heroEyebrow}
            </p>
            <h1 className="mt-4 max-w-3xl text-4xl font-semibold tracking-[-0.05em] text-[var(--ink-strong)] sm:text-5xl lg:text-6xl">
              {copy.heroTitle}
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-8 text-[var(--ink-muted)] sm:text-lg">
              {copy.heroDescription}
            </p>

            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              {copy.featuredHighlights.map((label) => (
                <div
                  key={label}
                  className="rounded-[1.4rem] border border-[var(--line-soft)] bg-white/70 px-4 py-4 text-sm font-medium text-[var(--ink-strong)]"
                >
                  {label}
                </div>
              ))}
            </div>
          </div>

          <Panel className="p-5 sm:p-6" id="categorias">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="font-mono text-xs uppercase tracking-[0.28em] text-[var(--ink-soft)]">
                  {copy.quickCategoriesTitle}
                </p>
                <p className="mt-3 text-sm leading-7 text-[var(--ink-muted)]">
                  Entra por la categoria mas cercana y ajusta despues con filtros.
                </p>
              </div>
              <Pill className="text-[var(--brand-deep)]">
                {products.length} {copy.resultCountSuffix}
              </Pill>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <button
                className="chip-button rounded-[1.4rem] px-4 py-4 text-left"
                data-active={activeFilters.category === undefined}
                onClick={() => handleQuickCategory(undefined)}
                type="button"
              >
                <span className="block text-sm font-semibold text-[var(--ink-strong)]">Todo Vendora</span>
                <span className="mt-2 block text-sm leading-6 text-[var(--ink-muted)]">
                  Recorrido general para ver catalogo completo.
                </span>
              </button>
              {categoryFacets.map((category) => (
                <button
                  key={category.id}
                  className="chip-button rounded-[1.4rem] px-4 py-4 text-left"
                  data-active={activeFilters.category === category.slug}
                  onClick={() => handleQuickCategory(category.slug)}
                  type="button"
                >
                  <span className="block text-sm font-semibold text-[var(--ink-strong)]">
                    {category.name}
                  </span>
                  <span className="mt-2 block text-sm leading-6 text-[var(--ink-muted)]">
                    {category.count} {copy.categoryCountSuffix}
                  </span>
                </button>
              ))}
            </div>

            {initialCategoryTree.length > 0 ? (
              <CategoryTreeNav
                tree={initialCategoryTree}
                activeSlug={activeFilters.category}
                onSelect={handleQuickCategory}
              />
            ) : null}
          </Panel>
        </div>
      </article>

      <CatalogToolbar
        activeFilterCount={activeFilterCount}
        filters={draftFilters}
        isLoading={isLoading}
        onClear={clearFilters}
        onQueryChange={(value) => setDraftFilters((current) => ({ ...current, query: value }))}
        onSortChange={(value) =>
          setDraftFilters((current) => ({ ...current, sort: value ?? "featured" }))
        }
        onSubmit={applyDraftFilters}
        onToggleFilters={() => setIsFiltersOpen((current) => !current)}
        showFilters={isFiltersOpen}
      />

      <div className="grid gap-6 lg:grid-cols-[18rem_minmax(0,1fr)] xl:grid-cols-[19.5rem_minmax(0,1fr)]">
        <div className="hidden self-start lg:sticky lg:top-28 lg:block">
          <CatalogFiltersPanel
            filters={draftFilters}
            metadata={collection?.filters ?? null}
            onApply={applyDraftFilters}
            onCategoryChange={(category) =>
              setDraftFilters((current) => ({ ...current, category }))
            }
            onMaxPriceChange={(value) =>
              setDraftFilters((current) => ({ ...current, maxPriceAmount: value }))
            }
            onMinPriceChange={(value) =>
              setDraftFilters((current) => ({ ...current, minPriceAmount: value }))
            }
          />
        </div>

        <div className="space-y-4">
          <div className="lg:hidden">
            <CatalogFiltersPanel
              filters={draftFilters}
              metadata={collection?.filters ?? null}
              onApply={applyDraftFilters}
              onCategoryChange={(category) =>
                setDraftFilters((current) => ({ ...current, category }))
              }
              onMaxPriceChange={(value) =>
                setDraftFilters((current) => ({ ...current, maxPriceAmount: value }))
              }
              onMinPriceChange={(value) =>
                setDraftFilters((current) => ({ ...current, minPriceAmount: value }))
              }
              visible={isFiltersOpen}
            />
          </div>

          {activeFilterCount > 0 ? (
            <div className="flex flex-wrap gap-2">
              {activeFilters.category ? (
                <Pill>{resolveCategoryName(activeFilters.category)}</Pill>
              ) : null}
              {activeFilters.query ? <Pill>Busqueda: {activeFilters.query}</Pill> : null}
              {activeFilters.minPriceAmount ? <Pill>Min: {activeFilters.minPriceAmount}</Pill> : null}
              {activeFilters.maxPriceAmount ? <Pill>Max: {activeFilters.maxPriceAmount}</Pill> : null}
              <Button onClick={clearFilters} variant="ghost">
                {copy.clearFilters}
              </Button>
            </div>
          ) : null}

          <CatalogGrid
            activeLabel={activeLabel}
            error={error}
            isLoading={isLoading}
            onRetry={() => void loadProducts(activeFilters)}
            products={products}
          />
        </div>
      </div>
    </section>
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
    <nav aria-label="Categorias" className="mt-6 border-t border-[var(--line-soft)] pt-5">
      <p className="font-mono text-xs uppercase tracking-[0.28em] text-[var(--ink-soft)]">
        {appCopy.storefrontHeader.categories}
      </p>
      <ul className="mt-4 grid gap-1">
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
        className="chip-button w-full rounded-[0.9rem] px-3 py-2 text-left text-sm font-medium text-[var(--ink-strong)]"
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
