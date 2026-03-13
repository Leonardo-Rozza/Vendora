import type { CartLine } from "../contracts";

export function formatMoney(amount: string | number, currencyCode: string) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: currencyCode,
    maximumFractionDigits: 0,
  }).format(Number(amount));
}

export function formatLineTotal(line: CartLine) {
  return formatMoney(Number(line.unitPriceAmount) * line.quantity, line.currencyCode);
}

export function formatItemCount(count: number) {
  return `${count} ${count === 1 ? "item" : "items"}`;
}
