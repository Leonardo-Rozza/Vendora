import type { CheckoutSnapshot } from "../contracts";

export function canStartCheckout(options: {
  isSubmitting: boolean;
  lineCount: number;
}) {
  return !options.isSubmitting && options.lineCount > 0;
}

export function toCheckoutErrorMessage(error: unknown) {
  if (
    error instanceof Error &&
    typeof Reflect.get(error, "status") === "number"
  ) {
    return error.message;
  }

  return "Checkout could not be prepared. Please retry.";
}

export function resolveCheckoutReferences(options: {
  searchParams: URLSearchParams;
  snapshot: CheckoutSnapshot | null;
}) {
  return {
    orderReference:
      options.searchParams.get("external_reference") ??
      options.snapshot?.orderId ??
      null,
    paymentReference:
      options.searchParams.get("payment_id") ??
      options.searchParams.get("collection_id") ??
      options.snapshot?.paymentId ??
      null,
  };
}
