import { Suspense } from "react";
import { CheckoutStatusClient } from "@/components/checkout/checkout-status-client";

export default function CheckoutFailurePage() {
  return (
    <Suspense>
      <CheckoutStatusClient status="failure" />
    </Suspense>
  );
}
