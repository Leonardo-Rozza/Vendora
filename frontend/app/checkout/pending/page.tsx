import { Suspense } from "react";
import { CheckoutStatusClient } from "@/components/checkout/checkout-status-client";

export default function CheckoutPendingPage() {
  return (
    <Suspense>
      <div hidden>Payment pending</div>
      <CheckoutStatusClient status="pending" />
    </Suspense>
  );
}
