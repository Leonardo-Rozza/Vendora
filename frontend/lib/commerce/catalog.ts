import type { AppliedAttributeFilter } from "../contracts";

/**
 * Parses the compact attribute filter string (`color:negro,azul;material:vidrio`)
 * into a map of attribute slug -> selected value slugs.
 */
export function parseAttributeFilter(
  compact?: string,
): Map<string, Set<string>> {
  const map = new Map<string, Set<string>>();

  if (!compact) {
    return map;
  }

  for (const group of compact.split(";")) {
    const [slug, rawValues] = group.split(":");
    const normalizedSlug = slug?.trim();

    if (!normalizedSlug || !rawValues) {
      continue;
    }

    const values = rawValues
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean);

    if (values.length === 0) {
      continue;
    }

    const existing = map.get(normalizedSlug) ?? new Set<string>();
    for (const value of values) {
      existing.add(value);
    }
    map.set(normalizedSlug, existing);
  }

  return map;
}

/** Serializes a map of attribute slug -> value slugs into the compact format. */
export function serializeAttributeFilter(
  map: Map<string, Set<string>>,
): string {
  const groups: string[] = [];

  for (const [slug, values] of map) {
    if (values.size === 0) {
      continue;
    }
    groups.push(`${slug}:${[...values].join(",")}`);
  }

  return groups.join(";");
}

/** Builds the compact string from the backend `applied.attributes` shape. */
export function appliedAttributesToCompact(
  applied: AppliedAttributeFilter[],
): string {
  return serializeAttributeFilter(
    new Map(applied.map((entry) => [entry.slug, new Set(entry.values)])),
  );
}

/** Toggles a single attribute value within a compact filter string. */
export function toggleAttributeValue(
  compact: string | undefined,
  attributeSlug: string,
  valueSlug: string,
): string {
  const map = parseAttributeFilter(compact);
  const values = map.get(attributeSlug) ?? new Set<string>();

  if (values.has(valueSlug)) {
    values.delete(valueSlug);
  } else {
    values.add(valueSlug);
  }

  if (values.size === 0) {
    map.delete(attributeSlug);
  } else {
    map.set(attributeSlug, values);
  }

  return serializeAttributeFilter(map);
}

export function toCatalogErrorMessage(error: unknown) {
  if (
    error instanceof Error &&
    typeof Reflect.get(error, "status") === "number"
  ) {
    return error.message;
  }

  return "Catalog is temporarily unavailable.";
}
