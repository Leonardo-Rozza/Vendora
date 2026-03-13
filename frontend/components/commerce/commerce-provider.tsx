"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { CartLine, CartState, CheckoutSnapshot } from "@/lib/contracts";
import {
  addCartLine,
  calculateCartTotals,
  CART_STORAGE_KEY,
  clearCart as clearCartState,
  createEmptyCartState,
  parseCartState,
  removeCartLine,
  serializeCartState,
  setLastCheckoutSnapshot,
  updateCartLineQuantity,
} from "@/lib/commerce/cart";

type CommerceContextValue = {
  cartState: CartState;
  hasHydrated: boolean;
  itemCount: number;
  subtotalAmount: string;
  currencyCode: string;
  addToCart: (line: CartLine) => void;
  updateQuantity: (variantId: string, quantity: number) => void;
  removeLine: (variantId: string) => void;
  clearCart: () => void;
  setLastCheckout: (snapshot: CheckoutSnapshot | null) => void;
};

const CommerceContext = createContext<CommerceContextValue | null>(null);

export function CommerceProvider({ children }: { children: ReactNode }) {
  const [cartState, setCartState] = useState<CartState>(createEmptyCartState);
  const [hasHydrated, setHasHydrated] = useState(false);

  useEffect(() => {
    const persistedState = parseCartState(window.localStorage.getItem(CART_STORAGE_KEY));
    setCartState(persistedState);
    setHasHydrated(true);
  }, []);

  useEffect(() => {
    if (!hasHydrated) {
      return;
    }

    window.localStorage.setItem(CART_STORAGE_KEY, serializeCartState(cartState));
  }, [cartState, hasHydrated]);

  const totals = useMemo(() => calculateCartTotals(cartState), [cartState]);

  const value = useMemo<CommerceContextValue>(
    () => ({
      cartState,
      hasHydrated,
      itemCount: totals.itemCount,
      subtotalAmount: totals.subtotalAmount,
      currencyCode: totals.currencyCode,
      addToCart: (line) => setCartState((currentState) => addCartLine(currentState, line)),
      updateQuantity: (variantId, quantity) =>
        setCartState((currentState) =>
          updateCartLineQuantity(currentState, variantId, quantity),
        ),
      removeLine: (variantId) =>
        setCartState((currentState) => removeCartLine(currentState, variantId)),
      clearCart: () => setCartState((currentState) => clearCartState(currentState)),
      setLastCheckout: (snapshot) =>
        setCartState((currentState) => setLastCheckoutSnapshot(currentState, snapshot)),
    }),
    [cartState, hasHydrated, totals],
  );

  return <CommerceContext.Provider value={value}>{children}</CommerceContext.Provider>;
}

export function useCommerce() {
  const context = useContext(CommerceContext);

  if (!context) {
    throw new Error("useCommerce must be used within CommerceProvider");
  }

  return context;
}
