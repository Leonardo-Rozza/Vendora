import type { CatalogFilters } from "@/lib/contracts";
import { appCopy, getCatalogSortLabel } from "@/lib/copy/es-ar";
import { CATALOG_SORT_OPTIONS } from "@/lib/contracts";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";

type CatalogToolbarProps = {
  activeFilterCount: number;
  activeLabel: string;
  resultLabel: string;
  filters: CatalogFilters;
  isLoading: boolean;
  onQueryChange: (value: string) => void;
  onSubmit: () => void;
  onToggleFilters: () => void;
  onSortChange: (value: CatalogFilters["sort"]) => void;
  showFilters: boolean;
};

export function CatalogToolbar({
  activeFilterCount,
  activeLabel,
  resultLabel,
  filters,
  isLoading,
  onQueryChange,
  onSubmit,
  onToggleFilters,
  onSortChange,
  showFilters,
}: CatalogToolbarProps) {
  const copy = appCopy.storefrontCatalog;

  return (
    <div className="grid gap-4" id="vd-grid-top">
      {/* Search bar */}
      <form
        className="flex flex-col gap-3 sm:flex-row sm:items-center"
        onSubmit={(event) => {
          event.preventDefault();
          onSubmit();
        }}
        role="search"
      >
        <div className="relative flex-1">
          <span
            aria-hidden
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[15px] text-ink-soft"
          >
            ⌕
          </span>
          <label className="sr-only" htmlFor="catalog-search">
            {copy.searchPlaceholder}
          </label>
          <input
            className="catalog-field rounded-field border-[1.5px] border-line-strong bg-surface-panel py-2.5 pl-9 pr-4 text-[15px] outline-none transition focus-visible:border-brand-deep focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-accent-sand"
            id="catalog-search"
            name="query"
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder={copy.searchPlaceholder}
            value={filters.query ?? ""}
          />
        </div>
        <Button className="sm:w-auto" disabled={isLoading} type="submit">
          {isLoading ? copy.searchPending : copy.searchSubmit}
        </Button>
      </form>

      <Breadcrumb
        items={[{ label: copy.browse, href: "/" }, { label: activeLabel }]}
      />

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-[clamp(22px,3vw,28px)] font-extrabold tracking-[-0.02em] text-ink-strong">
            {activeLabel}
          </h2>
          <p className="mt-1.5 text-[13.5px] text-ink-soft">{resultLabel}</p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            className="lg:hidden"
            onClick={onToggleFilters}
            size="sm"
            variant="secondary"
          >
            <span aria-hidden>⚙</span>
            {showFilters ? copy.filterClose : copy.filterToggle}
            {activeFilterCount > 0 ? (
              <span className="rounded-[6px] bg-brand-deep px-1.5 py-px text-[11px] font-bold text-surface-base">
                {activeFilterCount}
              </span>
            ) : null}
          </Button>

          <label className="relative inline-flex">
            <span className="sr-only">{copy.sortLabel}</span>
            <select
              aria-label={copy.sortLabel}
              className="catalog-field cursor-pointer appearance-none rounded-field border-[1.5px] border-line-strong bg-surface-panel py-2.5 pl-3.5 pr-9 text-sm font-semibold text-ink-strong outline-none transition focus-visible:border-brand-deep focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-accent-sand"
              onChange={(event) => onSortChange(event.target.value as CatalogFilters["sort"])}
              value={filters.sort ?? "featured"}
            >
              {CATALOG_SORT_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {getCatalogSortLabel(option)}
                </option>
              ))}
            </select>
            <span
              aria-hidden
              className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-[11px] text-ink-soft"
            >
              ▼
            </span>
          </label>
        </div>
      </div>
    </div>
  );
}
