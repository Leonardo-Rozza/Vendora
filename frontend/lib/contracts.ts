/** Category reference embedded in a product. */
export type CategoryRef = {
  id: string;
  name: string;
  slug: string;
};

/** A category in the catalog facet, with its product count. */
export type CategoryFacet = CategoryRef & {
  parentId: string | null;
  count: number;
};

/** A node in the category tree (GET /catalog/categories). */
export type CategoryNode = CategoryRef & {
  parentId: string | null;
  sortOrder: number;
  children: CategoryNode[];
};

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
  assetKey: string | null;
  altText: string | null;
  sortOrder: number;
};

/** An attribute value assigned to a product (e.g. Color: Negro). */
export type ProductAttribute = {
  attributeId: string;
  attributeName: string;
  attributeSlug: string;
  value: string;
  valueSlug: string;
};

/** A single attribute value facet with its discovery-set product count. */
export type AttributeValueFacet = {
  id: string;
  value: string;
  slug: string;
  count: number;
};

/** An attribute facet, grouping its value facets. */
export type AttributeFacet = {
  id: string;
  name: string;
  slug: string;
  values: AttributeValueFacet[];
};

/** Applied attribute filter, by attribute slug and selected value slugs. */
export type AppliedAttributeFilter = {
  slug: string;
  values: string[];
};

/** Pagination metadata for a catalog collection response. */
export type PaginationMeta = {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

/** An attribute with all its values (GET /catalog/attributes). */
export type AttributeOption = {
  id: string;
  name: string;
  slug: string;
  values: Array<{ id: string; value: string; slug: string }>;
};

export type CatalogProductDetail = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  status: string;
  category: CategoryRef | null;
  variants: CatalogVariantPreview[];
  images: CatalogImageReference[];
  attributes: ProductAttribute[];
};

export type CatalogProductCard = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  status: string;
  category: CategoryRef | null;
  variants: CatalogVariantPreview[];
  primaryImageUrl: string | null;
  primaryImageAlt: string | null;
  startingPriceAmount: string | null;
  currencyCode: string | null;
  attributes: ProductAttribute[];
};

export type CatalogFilters = {
  query?: string;
  /** Category slug. */
  category?: string;
  minPriceAmount?: string;
  maxPriceAmount?: string;
  sort?: CatalogSortOption;
  /** Compact attribute filter, e.g. `color:negro,azul;material:vidrio`. */
  attributes?: string;
  page?: number;
  pageSize?: number;
};

export type CatalogFilterMetadata = {
  categories: CategoryFacet[];
  attributes: AttributeFacet[];
  priceRange: {
    minAmount: string | null;
    maxAmount: string | null;
  };
  availableSorts: CatalogSortOption[];
  applied: {
    query: string | null;
    category: string | null;
    minPriceAmount: string | null;
    maxPriceAmount: string | null;
    sort: CatalogSortOption;
    attributes: AppliedAttributeFilter[];
  };
};

export type CatalogCollectionResponse = {
  items: CatalogProductDetail[];
  filters: CatalogFilterMetadata;
  pagination: PaginationMeta;
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

export type CartAvailabilityLine = {
  variantId: string;
  requestedQuantity: number;
  availableQuantity: number;
  available: boolean;
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

export type CouponEvaluation =
  | {
      valid: true;
      code: string;
      type: "PERCENTAGE" | "FIXED";
      discountAmount: string;
    }
  | { valid: false; reason: string };

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
  couponCode?: string;
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
  discountAmount: string;
  couponCode: string | null;
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
  category: CategoryRef | null;
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
  attributes?: ProductAttribute[];
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
  categoryId?: string;
  variants: ProductVariantInput[];
  images?: ProductImageInput[];
  attributeValueIds?: string[];
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
  categoryId?: string;
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
