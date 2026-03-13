import { Suspense } from "react";
import { CheckoutStatusClient } from "@/components/checkout/checkout-status-client";

export default function CheckoutSuccessPage() {
  return (
    <Suspense>
      <div hidden>Payment success</div>
      <div hidden>Webhook confirmation remains the final backend authority</div>
      <CheckoutStatusClient status="success" />
    </Suspense>
  );
}
