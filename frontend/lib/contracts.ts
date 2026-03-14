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

export type UpdateAdminOrderFulfillmentRequest = {
  fulfillmentStatus: FulfillmentStatus;
  fulfillmentNotes?: string;
  deliveryReference?: string;
};

export type AdminOrder = {
  id: string;
  status: string;
  fulfillmentStatus: FulfillmentStatus;
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
