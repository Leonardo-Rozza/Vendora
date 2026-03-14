import type { CheckoutFormState, CheckoutSnapshot } from "../contracts";

const CABA_PROVINCES = new Set([
  "caba",
  "capital federal",
  "ciudad autonoma de buenos aires",
  "buenos aires city",
]);

const AMBA_LOCALITIES = new Set([
  "almirante brown",
  "avellaneda",
  "berazategui",
  "esteban echeverria",
  "ezeiza",
  "florencio varela",
  "general san martin",
  "hurlingham",
  "ituzaingo",
  "jose c paz",
  "la matanza",
  "lanus",
  "lomas de zamora",
  "malvinas argentinas",
  "merlo",
  "moreno",
  "moron",
  "pilar",
  "quilmes",
  "san fernando",
  "san isidro",
  "san martin",
  "san miguel",
  "tigre",
  "tres de febrero",
  "vicente lopez",
]);

export function canStartCheckout(options: {
  isSubmitting: boolean;
  lineCount: number;
}) {
  return !options.isSubmitting && options.lineCount > 0;
}

export function validateCheckoutForm(form: CheckoutFormState) {
  const requiredValues = [
    form.fullName,
    form.email,
    form.phone,
    form.recipientName,
    form.shippingPhone,
    form.streetLine1,
    form.locality,
    form.province,
    form.postalCode,
  ];

  if (requiredValues.some((value) => value.trim().length === 0)) {
    return "Completa los datos de contacto y entrega antes de continuar.";
  }

  if (!isWithinAmbaShippingScope({ locality: form.locality, province: form.province })) {
    return "Por ahora solo hacemos envios dentro de CABA y AMBA.";
  }

  return null;
}

export function toCheckoutErrorMessage(error: unknown) {
  if (isApiError(error)) {
    return error.message;
  }

  return "No pudimos preparar el checkout. Intenta nuevamente.";
}

function isApiError(error: unknown): error is Error & { status: number } {
  return (
    error instanceof Error &&
    typeof (error as { status?: unknown }).status === "number"
  );
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

export function isWithinAmbaShippingScope(input: {
  locality: string;
  province: string;
}) {
  const province = normalizeValue(input.province);
  const locality = normalizeValue(input.locality);

  if (!province || !locality) {
    return false;
  }

  if (CABA_PROVINCES.has(province)) {
    return true;
  }

  return province === "buenos aires" && AMBA_LOCALITIES.has(locality);
}

function normalizeValue(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");
}
