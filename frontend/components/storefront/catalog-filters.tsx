import type { CatalogFilterMetadata, CatalogFilters, ProductCategory } from "@/lib/contracts";
import { PRODUCT_CATEGORIES } from "@/lib/contracts";
import { appCopy, getProductCategoryLabel } from "@/lib/copy/es-ar";
import { Button } from "@/components/ui/button";
import { Panel } from "@/components/ui/panel";

type CatalogFiltersProps = {
  filters: CatalogFilters;
  metadata: CatalogFilterMetadata | null;
  onApply: () => void;
  onCategoryChange: (category?: ProductCategory) => void;
  onMaxPriceChange: (value: string) => void;
  onMinPriceChange: (value: string) => void;
  visible?: boolean;
};

export function CatalogFilters({
  filters,
  metadata,
  onApply,
  onCategoryChange,
  onMaxPriceChange,
  onMinPriceChange,
  visible = true,
}: CatalogFiltersProps) {
  const copy = appCopy.storefrontCatalog;

  if (!visible) {
    return null;
  }

  const availableCategories =
    metadata && metadata.categories.length > 0
      ? metadata.categories
      : PRODUCT_CATEGORIES.map((category) => ({ value: category, count: 0 }));

  return (
    <Panel className="p-5">
      <div className="flex flex-col gap-5">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.28em] text-[var(--ink-soft)]">
            {copy.filtersTitle}
          </p>
          <p className="mt-3 text-sm leading-7 text-[var(--ink-muted)]">
            {copy.filtersDescription}
          </p>
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--ink-soft)]">
            {copy.categoryLabel}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              className="chip-button rounded-full px-4 py-2 text-sm font-semibold text-[var(--ink-strong)]"
              data-active={filters.category === undefined}
              onClick={() => onCategoryChange(undefined)}
              type="button"
            >
              Todas
            </button>
            {availableCategories.map((category) => (
              <button
                key={category.value}
                className="chip-button rounded-full px-4 py-2 text-sm font-semibold text-[var(--ink-strong)]"
                data-active={filters.category === category.value}
                onClick={() => onCategoryChange(category.value)}
                type="button"
              >
                {getProductCategoryLabel(category.value)}
                {category.count > 0 ? ` (${category.count})` : ""}
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
          <label className="text-sm font-medium text-[var(--ink-strong)]">
            {copy.minPriceLabel}
            <input
              className="catalog-field mt-2 rounded-[1rem] px-4 py-3 outline-none transition focus:border-[var(--brand-deep)]"
              inputMode="numeric"
              onChange={(event) => onMinPriceChange(event.target.value)}
              placeholder={metadata?.priceRange.minAmount ?? "0"}
              value={filters.minPriceAmount ?? ""}
            />
          </label>
          <label className="text-sm font-medium text-[var(--ink-strong)]">
            {copy.maxPriceLabel}
            <input
              className="catalog-field mt-2 rounded-[1rem] px-4 py-3 outline-none transition focus:border-[var(--brand-deep)]"
              inputMode="numeric"
              onChange={(event) => onMaxPriceChange(event.target.value)}
              placeholder={metadata?.priceRange.maxAmount ?? "0"}
              value={filters.maxPriceAmount ?? ""}
            />
          </label>
        </div>

        <Button className="w-full" onClick={onApply}>
          {copy.applyFilters}
        </Button>
      </div>
    </Panel>
  );
}
