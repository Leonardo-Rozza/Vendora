import { Suspense } from "react";
import { CheckoutStatusClient } from "@/components/checkout/checkout-status-client";

export default function CheckoutSuccessPage() {
  return (
    <Suspense>
      <CheckoutStatusClient status="success" />
    </Suspense>
  );
}
