import { Suspense } from "react";
import { CheckoutStatusClient } from "@/components/checkout/checkout-status-client";

export default function CheckoutPendingPage() {
  return (
    <Suspense>
      <CheckoutStatusClient status="pending" />
    </Suspense>
  );
}
