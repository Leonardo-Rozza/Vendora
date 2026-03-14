import type { CatalogFilters } from "@/lib/contracts";
import { appCopy, getCatalogSortLabel } from "@/lib/copy/es-ar";
import { CATALOG_SORT_OPTIONS } from "@/lib/contracts";
import { Button } from "@/components/ui/button";
import { Pill } from "@/components/ui/pill";

type CatalogToolbarProps = {
  activeFilterCount: number;
  filters: CatalogFilters;
  isLoading: boolean;
  onClear: () => void;
  onQueryChange: (value: string) => void;
  onSubmit: () => void;
  onToggleFilters: () => void;
  onSortChange: (value: CatalogFilters["sort"]) => void;
  showFilters: boolean;
};

export function CatalogToolbar({
  activeFilterCount,
  filters,
  isLoading,
  onClear,
  onQueryChange,
  onSubmit,
  onToggleFilters,
  onSortChange,
  showFilters,
}: CatalogToolbarProps) {
  const copy = appCopy.storefrontCatalog;

  return (
    <div className="flex flex-col gap-4 rounded-[1.5rem] border border-[var(--line-soft)] bg-white/70 p-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <label className="flex-1">
          <span className="sr-only">{copy.searchPlaceholder}</span>
          <input
            className="catalog-field w-full rounded-full px-5 py-3 text-sm outline-none transition focus:border-[var(--brand-deep)]"
            name="query"
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder={copy.searchPlaceholder}
            value={filters.query ?? ""}
          />
        </label>
        <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto_auto] lg:min-w-[28rem]">
          <label className="text-sm font-medium text-[var(--ink-strong)]">
            <span className="mb-2 block text-xs uppercase tracking-[0.2em] text-[var(--ink-soft)]">
              {copy.sortLabel}
            </span>
            <select
              className="catalog-field w-full rounded-full px-4 py-3 outline-none transition focus:border-[var(--brand-deep)]"
              onChange={(event) => onSortChange(event.target.value as CatalogFilters["sort"])}
              value={filters.sort ?? "featured"}
            >
              {CATALOG_SORT_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {getCatalogSortLabel(option)}
                </option>
              ))}
            </select>
          </label>
          <div className="flex items-end">
            <Button className="w-full sm:w-auto" onClick={onToggleFilters} variant="secondary">
              {showFilters ? copy.filterClose : copy.filterToggle}
            </Button>
          </div>
          <div className="flex items-end">
            <Button className="w-full sm:w-auto" disabled={isLoading} onClick={onSubmit}>
              {isLoading ? copy.searchPending : copy.searchSubmit}
            </Button>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <Pill className="text-[var(--brand-deep)]">{copy.activeFiltersTitle}</Pill>
          {activeFilterCount === 0 ? (
            <span className="text-sm text-[var(--ink-muted)]">{copy.allProducts}</span>
          ) : (
            <span className="text-sm text-[var(--ink-muted)]">
              {activeFilterCount} filtros aplicados
            </span>
          )}
        </div>
        <Button onClick={onClear} variant="ghost">
          {copy.clearFilters}
        </Button>
      </div>
    </div>
  );
}
