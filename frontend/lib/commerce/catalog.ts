export function toCatalogErrorMessage(error: unknown) {
  if (
    error instanceof Error &&
    typeof Reflect.get(error, "status") === "number"
  ) {
    return error.message;
  }

  return "Catalog is temporarily unavailable.";
}
