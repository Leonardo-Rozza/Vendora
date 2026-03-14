export const PRODUCT_CATEGORIES = [
  "ELECTRONICA",
  "HOGAR",
  "ACCESORIOS",
] as const;

export type ProductCategory = (typeof PRODUCT_CATEGORIES)[number];

export const CATALOG_SORT_OPTIONS = [
  "featured",
  "price-asc",
  "price-desc",
  "newest",
] as const;

export type CatalogSortOption = (typeof CATALOG_SORT_OPTIONS)[number];

export type CatalogVariantPreview = {
  id: string;
  sku: string;
  name: string;
  priceAmount: string;
  currencyCode: string;
  availableQuantity?: number;
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
  category: ProductCategory | null;
  variants: CatalogVariantPreview[];
  images: CatalogImageReference[];
};

export type CatalogProductCard = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  status: string;
  category: ProductCategory | null;
  variants: CatalogVariantPreview[];
  primaryImageUrl: string | null;
  primaryImageAlt: string | null;
  startingPriceAmount: string | null;
  currencyCode: string | null;
};

export type CatalogFilters = {
  query?: string;
  category?: ProductCategory;
  minPriceAmount?: string;
  maxPriceAmount?: string;
  sort?: CatalogSortOption;
};

export type CatalogFilterMetadata = {
  categories: Array<{
    value: ProductCategory;
    count: number;
  }>;
  priceRange: {
    minAmount: string | null;
    maxAmount: string | null;
  };
  availableSorts: CatalogSortOption[];
  applied: {
    query: string | null;
    category: ProductCategory | null;
    minPriceAmount: string | null;
    maxPriceAmount: string | null;
    sort: CatalogSortOption;
  };
};

export type CatalogCollectionResponse = {
  items: CatalogProductDetail[];
  filters: CatalogFilterMetadata;
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
  trackingToken?: string;
  trackingCode?: string;
  trackingUrlPath?: string;
  itemCount: number;
  totalAmount: string;
  currencyCode: string;
  submittedAt: string;
};

export type BuyerTrackingStatus =
  | "PAGO_PENDIENTE"
  | "PAGO_CONFIRMADO"
  | "PREPARANDO_PEDIDO"
  | "LISTO_PARA_ENTREGA"
  | "EN_CAMINO"
  | "ENTREGADO"
  | "CANCELADO";

export type CartState = {
  lines: CartLine[];
  lastCheckout: CheckoutSnapshot | null;
};

export type CreateOrderRequest = {
  items: Array<{
    variantId: string;
    quantity: number;
  }>;
  contact: {
    fullName: string;
    email: string;
    phone: string;
  };
  shippingAddress: ShippingAddressInput;
};

export type ShippingAddressInput = {
  recipientName: string;
  phone: string;
  streetLine1: string;
  streetLine2?: string;
  locality: string;
  province: string;
  postalCode: string;
  deliveryNotes?: string;
};

export type CheckoutFormState = {
  fullName: string;
  email: string;
  phone: string;
  recipientName: string;
  shippingPhone: string;
  streetLine1: string;
  streetLine2: string;
  locality: string;
  province: string;
  postalCode: string;
  deliveryNotes: string;
};

export type CreatedOrder = {
  id: string;
  status: string;
  trackingToken: string | null;
  trackingCode: string | null;
  trackingUrlPath: string | null;
  currencyCode: string;
  subtotalAmount: string;
  totalAmount: string;
  contactFullName: string;
  contactEmail: string;
  contactPhone: string;
  shippingRecipientName: string;
  shippingPhone: string;
  shippingStreetLine1: string;
  shippingStreetLine2: string | null;
  shippingLocality: string;
  shippingProvince: string;
  shippingPostalCode: string;
  shippingDeliveryNotes: string | null;
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

export type AdminSession = {
  userId: string;
  email: string;
  role: "ADMIN";
  expiresAt: string;
};

export type AdminProduct = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  status: string;
  category: ProductCategory | null;
  variants: Array<
    CatalogVariantPreview & {
      availableQuantity?: number;
      inventoryItem?: {
        availableQuantity: number;
        reservedQuantity: number;
      } | null;
    }
  >;
  images: CatalogImageReference[];
};

export type ProductVariantInput = {
  id?: string;
  sku: string;
  name: string;
  priceAmount: string;
  currencyCode: string;
  availableQuantity?: number;
};

export type ProductImageInput = {
  assetUrl: string;
  assetKey?: string | null;
  altText?: string | null;
  sortOrder?: number;
};

export type AdminProductInput = {
  slug: string;
  name: string;
  description?: string;
  status?: string;
  category?: ProductCategory;
  variants: ProductVariantInput[];
  images?: ProductImageInput[];
};

export type FulfillmentStatus =
  | "REQUESTED"
  | "CONFIRMED"
  | "PREPARING"
  | "READY_FOR_DELIVERY"
  | "OUT_FOR_DELIVERY"
  | "DELIVERED";

export type ListAdminOrdersQuery = {
  status?: string;
  fulfillmentStatus?: FulfillmentStatus;
};

export type ListAdminProductsQuery = {
  query?: string;
  status?: string;
  category?: ProductCategory;
};

export type UpdateAdminOrderFulfillmentRequest = {
  fulfillmentStatus: FulfillmentStatus;
  fulfillmentNotes?: string;
  deliveryReference?: string;
};

export type AdminOrder = {
  id: string;
  status: string;
  fulfillmentStatus: FulfillmentStatus;
  trackingToken?: string | null;
  trackingCode?: string | null;
  trackingUrlPath?: string | null;
  buyerTrackingStatus?: BuyerTrackingStatus;
  buyerTrackingLabel?: string;
  buyerTrackingDescription?: string;
  currencyCode: string;
  subtotalAmount: string;
  totalAmount: string;
  contactFullName: string;
  contactEmail: string;
  contactPhone: string;
  shippingRecipientName: string;
  shippingPhone: string;
  shippingStreetLine1: string;
  shippingStreetLine2: string | null;
  shippingLocality: string;
  shippingProvince: string;
  shippingPostalCode: string;
  shippingDeliveryNotes: string | null;
  fulfillmentNotes: string | null;
  deliveryReference: string | null;
  paidAt: string | null;
  createdAt?: string;
  items: Array<{
    id?: string;
    variantId: string;
    quantity: number;
    productName: string;
    variantName: string;
    sku: string;
    unitPriceAmount: string;
  }>;
  payments: Array<{
    id?: string;
    status: string;
    provider?: string;
  }>;
};

export type OrderTrackingMilestone = {
  id: string;
  type: string;
  title: string;
  description: string;
  occurredAt: string;
  deliveryReference: string | null;
};

export type OrderTrackingView = {
  orderId: string;
  trackingCode: string | null;
  trackingToken: string | null;
  trackingUrlPath: string | null;
  status: BuyerTrackingStatus;
  statusLabel: string;
  statusDescription: string;
  contactName: string;
  itemCount: number;
  totalAmount: string;
  currencyCode: string;
  paidAt: string | null;
  createdAt: string;
  deliveryReference: string | null;
  timeline: OrderTrackingMilestone[];
  items: Array<{
    productName: string;
    variantName: string;
    quantity: number;
  }>;
};
