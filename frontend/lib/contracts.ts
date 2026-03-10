export type CatalogVariantPreview = {
  id: string;
  sku: string;
  name: string;
  priceAmount: string;
  currencyCode: string;
};

export type CatalogImageReference = {
  id: string;
  assetUrl: string;
  assetKey: string;
  altText: string | null;
  sortOrder: number;
};

export type CatalogProductDetail = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  status: string;
  variants: CatalogVariantPreview[];
  images: CatalogImageReference[];
};

export type StorefrontHighlight = {
  title: string;
  description: string;
  href: string;
};

export type AdminWorkspace = {
  title: string;
  description: string;
  status: string;
};
