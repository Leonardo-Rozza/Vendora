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

export type CatalogProductCard = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  status: string;
  variants: CatalogVariantPreview[];
  primaryImageUrl: string | null;
  primaryImageAlt: string | null;
  startingPriceAmount: string | null;
  currencyCode: string | null;
};

export type CartLine = {
  variantId: string;
  sku: string;
  productId: string;
  productSlug: string;
  productName: string;
  variantName: string;
  unitPriceAmount: string;
  currencyCode: string;
  imageUrl: string | null;
  imageAlt: string | null;
  quantity: number;
};

export type CheckoutStatusRoute = "success" | "pending" | "failure";

export type CheckoutSnapshot = {
  orderId: string;
  paymentId?: string;
  preferenceId?: string;
  itemCount: number;
  totalAmount: string;
  currencyCode: string;
  submittedAt: string;
};

export type CartState = {
  lines: CartLine[];
  lastCheckout: CheckoutSnapshot | null;
};

export type CreateOrderRequest = {
  items: Array<{
    variantId: string;
    quantity: number;
  }>;
};

export type CreatedOrder = {
  id: string;
  status: string;
  currencyCode: string;
  subtotalAmount: string;
  totalAmount: string;
  items: Array<{
    variantId: string;
    quantity: number;
    productName: string;
    variantName: string;
    sku: string;
    unitPriceAmount: string;
  }>;
};

export type CreateCheckoutPreferenceRequest = {
  orderId: string;
  payerEmail?: string;
};

export type CheckoutPreferenceResponse = {
  orderId: string;
  paymentId: string;
  provider: "mercado-pago";
  preferenceId: string;
  initPoint: string;
  payerEmail?: string;
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
