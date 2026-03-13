import { CartPageClient } from "@/components/cart/cart-page-client";

export default function CartPage() {
  return (
    <>
      <div hidden>Cart destination</div>
      <div hidden>Your cart is empty.</div>
      <CartPageClient />
    </>
  );
}
