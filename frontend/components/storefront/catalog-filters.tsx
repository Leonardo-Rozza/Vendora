import type { CatalogFilterMetadata, CatalogFilters } from "@/lib/contracts";
import { parseAttributeFilter } from "@/lib/commerce/catalog";
import { appCopy } from "@/lib/copy/es-ar";
import { Button } from "@/components/ui/button";

type CatalogFiltersProps = {
  filters: CatalogFilters;
  metadata: CatalogFilterMetadata | null;
  activeFilterCount: number;
  onApply: () => void;
  onClear: () => void;
  onCategoryChange: (category?: string) => void;
  onMaxPriceChange: (value: string) => void;
  onMinPriceChange: (value: string) => void;
  onAttributeToggle: (attributeSlug: string, valueSlug: string) => void;
  visible?: boolean;
};

const eyebrowClass =
  "font-mono text-[11px] uppercase tracking-[0.12em] text-ink-soft";

export function CatalogFilters({
  filters,
  metadata,
  activeFilterCount,
  onApply,
  onClear,
  onCategoryChange,
  onMaxPriceChange,
  onMinPriceChange,
  onAttributeToggle,
  visible = true,
}: CatalogFiltersProps) {
  const copy = appCopy.storefrontCatalog;

  if (!visible) {
    return null;
  }

  const availableCategories = metadata?.categories ?? [];
  const availableAttributes = metadata?.attributes ?? [];
  const selectedAttributes = parseAttributeFilter(filters.attributes);

  return (
    <div className="rounded-card border border-line-soft bg-surface-panel p-5">
      <div className="mb-5 flex items-center justify-between">
        <span className="text-base font-extrabold text-ink-strong">
          {copy.filterToggle}
        </span>
        {activeFilterCount > 0 ? (
          <button
            className="text-[12.5px] font-bold text-brand-deep transition-colors hover:text-brand-hover"
            onClick={onClear}
            type="button"
          >
            {copy.clearFilters}
          </button>
        ) : null}
      </div>

      <div className="flex flex-col gap-6">
        {/* Categoría */}
        <div>
          <p className={`${eyebrowClass} mb-3`}>{copy.categoryLabel}</p>
          <div className="flex flex-wrap gap-2">
            <button
              className="chip-button rounded-field px-3.5 py-2 text-sm font-semibold text-ink-strong"
              data-active={filters.category === undefined}
              onClick={() => onCategoryChange(undefined)}
              type="button"
            >
              Todas
            </button>
            {availableCategories.map((category) => (
              <button
                key={category.id}
                className="chip-button rounded-field px-3.5 py-2 text-sm font-semibold text-ink-strong"
                data-active={filters.category === category.slug}
                onClick={() => onCategoryChange(category.slug)}
                type="button"
              >
                {category.name}
                {category.count > 0 ? ` (${category.count})` : ""}
              </button>
            ))}
          </div>
        </div>

        {/* Precio */}
        <div>
          <p className={`${eyebrowClass} mb-3`}>Precio</p>
          <div className="grid grid-cols-2 gap-3">
            <label className="text-[13px] font-medium text-ink-strong">
              <span className="mb-1.5 block text-ink-soft">{copy.minPriceLabel}</span>
              <input
                className="catalog-field rounded-field border-[1.5px] border-line-strong bg-surface-panel px-3 py-2.5 text-sm outline-none transition focus-visible:border-brand-deep focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-accent-sand"
                inputMode="numeric"
                onChange={(event) => onMinPriceChange(event.target.value)}
                placeholder={metadata?.priceRange.minAmount ?? "0"}
                value={filters.minPriceAmount ?? ""}
              />
            </label>
            <label className="text-[13px] font-medium text-ink-strong">
              <span className="mb-1.5 block text-ink-soft">{copy.maxPriceLabel}</span>
              <input
                className="catalog-field rounded-field border-[1.5px] border-line-strong bg-surface-panel px-3 py-2.5 text-sm outline-none transition focus-visible:border-brand-deep focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-accent-sand"
                inputMode="numeric"
                onChange={(event) => onMaxPriceChange(event.target.value)}
                placeholder={metadata?.priceRange.maxAmount ?? "0"}
                value={filters.maxPriceAmount ?? ""}
              />
            </label>
          </div>
        </div>

        {/* Atributos dinámicos */}
        {availableAttributes.map((attribute) => {
          const selectedValues =
            selectedAttributes.get(attribute.slug) ?? new Set<string>();

          return (
            <fieldset key={attribute.id} className="border-0 p-0">
              <legend className={`${eyebrowClass} mb-3`}>{attribute.name}</legend>
              <div className="flex flex-col gap-1">
                {attribute.values.map((value) => {
                  const inputId = `attr-${attribute.slug}-${value.slug}`;
                  const isChecked = selectedValues.has(value.slug);

                  return (
                    <label
                      key={value.id}
                      className="flex w-full cursor-pointer items-center gap-2.5 rounded-[9px] px-2.5 py-1.5 transition-colors hover:bg-surface-sand data-[active=true]:bg-surface-sand"
                      data-active={isChecked}
                      htmlFor={inputId}
                    >
                      <span
                        aria-hidden
                        className={`grid size-[18px] flex-shrink-0 place-items-center rounded-[5px] ${
                          isChecked
                            ? "bg-brand-deep shadow-[inset_0_0_0_1.5px_var(--brand-deep)]"
                            : "bg-surface-panel shadow-[inset_0_0_0_1.5px_var(--line-strong)]"
                        }`}
                      >
                        {isChecked ? (
                          <span className="text-[11px] leading-none text-white">✓</span>
                        ) : null}
                      </span>
                      <input
                        checked={isChecked}
                        className="sr-only"
                        id={inputId}
                        onChange={() => onAttributeToggle(attribute.slug, value.slug)}
                        type="checkbox"
                      />
                      <span className="flex-1 text-sm font-medium text-ink-strong">
                        {value.value}
                      </span>
                      <span className="font-mono text-xs text-ink-faint">
                        {value.count}
                      </span>
                    </label>
                  );
                })}
              </div>
            </fieldset>
          );
        })}

        <Button className="w-full" onClick={onApply}>
          {copy.applyFilters}
        </Button>
      </div>
    </div>
  );
}
