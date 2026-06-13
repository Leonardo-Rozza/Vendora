/**
 * Mercado Pago gateway contract.
 *
 * The rest of the app depends only on this interface (via the
 * {@link MERCADO_PAGO_GATEWAY} token), never on a concrete SDK. A real,
 * SDK-backed implementation is used when Mercado Pago credentials are present;
 * a fake implementation keeps local/"dry-run" development working without
 * talking to Mercado Pago.
 */

export type CheckoutPreferenceItem = {
  sku: string;
  title: string;
  quantity: number;
  unitPriceAmount: string;
};

export type CreateCheckoutPreferenceInput = {
  orderId: string;
  currencyCode: string;
  items: CheckoutPreferenceItem[];
  payerEmail?: string;
};

export type CheckoutPreference = {
  provider: 'mercado-pago';
  preferenceId: string;
  initPoint: string;
  externalReference: string;
  payerEmail?: string;
  currencyCode: string;
  notificationPath: string;
  backUrls?: {
    success: string;
    pending: string;
    failure: string;
  };
  autoReturn?: 'approved';
};

/** Canonical Mercado Pago payment statuses we care about. */
export type MercadoPagoPaymentStatus =
  | 'approved'
  | 'authorized'
  | 'pending'
  | 'rejected'
  | 'cancelled'
  | 'refunded';

/**
 * Authoritative payment snapshot fetched from Mercado Pago. The webhook trusts
 * THIS, never the status sent in the request body.
 */
export type MercadoPagoPaymentSnapshot = {
  id: string;
  status: MercadoPagoPaymentStatus;
  /** Mercado Pago `external_reference` — our order id, set at preference time. */
  externalReference: string | null;
};

export type WebhookSignatureInput = {
  /** Mercado Pago payment id carried in the notification (`data.id`). */
  dataId: string;
  /** Raw `x-signature` request header. */
  signature?: string;
  /** Raw `x-request-id` request header. */
  requestId?: string;
};

export interface MercadoPagoGateway {
  createCheckoutPreference(
    input: CreateCheckoutPreferenceInput,
  ): Promise<CheckoutPreference>;

  /** Fetches the authoritative payment state from Mercado Pago. */
  getPayment(paymentId: string): Promise<MercadoPagoPaymentSnapshot>;

  /** Verifies a webhook's `x-signature`. Returns false when it cannot be trusted. */
  verifyWebhookSignature(input: WebhookSignatureInput): boolean;
}

export const MERCADO_PAGO_GATEWAY = Symbol('MERCADO_PAGO_GATEWAY');
