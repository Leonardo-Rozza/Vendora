import type {
  CartLine,
  CartState,
  CheckoutSnapshot,
  CreateOrderRequest,
} from "../contracts";

export const CART_STORAGE_KEY = "vendora.storefront.cart";

export function createEmptyCartState(): CartState {
  return {
    lines: [],
    lastCheckout: null,
  };
}

export function addCartLine(state: CartState, line: CartLine): CartState {
  const existingLine = state.lines.find((entry) => entry.variantId === line.variantId);

  if (!existingLine) {
    return {
      ...state,
      lines: [...state.lines, line],
    };
  }

  return {
    ...state,
    lines: state.lines.map((entry) =>
      entry.variantId === line.variantId
        ? { ...entry, quantity: entry.quantity + line.quantity }
        : entry,
    ),
  };
}

export function updateCartLineQuantity(
  state: CartState,
  variantId: string,
  quantity: number,
): CartState {
  if (quantity <= 0) {
    return removeCartLine(state, variantId);
  }

  return {
    ...state,
    lines: state.lines.map((entry) =>
      entry.variantId === variantId ? { ...entry, quantity } : entry,
    ),
  };
}

export function removeCartLine(state: CartState, variantId: string): CartState {
  return {
    ...state,
    lines: state.lines.filter((entry) => entry.variantId !== variantId),
  };
}

export function clearCart(state: CartState): CartState {
  return {
    ...state,
    lines: [],
  };
}

export function setLastCheckoutSnapshot(
  state: CartState,
  snapshot: CheckoutSnapshot | null,
): CartState {
  return {
    ...state,
    lastCheckout: snapshot,
  };
}

export function calculateCartTotals(state: CartState) {
  const itemCount = state.lines.reduce((count, line) => count + line.quantity, 0);
  const subtotalAmount = state.lines.reduce(
    (total, line) => total + Number(line.unitPriceAmount) * line.quantity,
    0,
  );
  const currencyCode = state.lines[0]?.currencyCode ?? "ARS";

  return {
    itemCount,
    subtotalAmount: String(subtotalAmount),
    currencyCode,
  };
}

export function serializeCartState(state: CartState) {
  return JSON.stringify(state);
}

export function parseCartState(input: string | null | undefined): CartState {
  if (!input) {
    return createEmptyCartState();
  }

  try {
    const parsed = JSON.parse(input) as Partial<CartState>;
    return {
      lines: Array.isArray(parsed.lines) ? parsed.lines : [],
      lastCheckout: parsed.lastCheckout ?? null,
    };
  } catch {
    return createEmptyCartState();
  }
}

export function toCreateOrderRequest(state: CartState): CreateOrderRequest {
  return {
    items: state.lines.map((line) => ({
      variantId: line.variantId,
      quantity: line.quantity,
    })),
  };
}
