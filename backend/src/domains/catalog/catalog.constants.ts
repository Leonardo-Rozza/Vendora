export enum CatalogSortOption {
  FEATURED = 'featured',
  PRICE_ASC = 'price-asc',
  PRICE_DESC = 'price-desc',
  NEWEST = 'newest',
}

export const DEFAULT_CATALOG_SORT = CatalogSortOption.FEATURED;

export const CATALOG_SORT_OPTIONS = [
  CatalogSortOption.FEATURED,
  CatalogSortOption.PRICE_ASC,
  CatalogSortOption.PRICE_DESC,
  CatalogSortOption.NEWEST,
];
