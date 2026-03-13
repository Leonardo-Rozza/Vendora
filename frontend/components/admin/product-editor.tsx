"use client";

import { useMemo, useState } from "react";
import type {
  AdminProduct,
  AdminProductInput,
  ProductImageInput,
  ProductVariantInput,
} from "@/lib/contracts";

type ProductEditorProps = {
  products: AdminProduct[];
  onCreate: (payload: AdminProductInput) => Promise<void>;
  onUpdate: (productId: string, payload: AdminProductInput) => Promise<void>;
};

const blankProductPayload = {
  slug: "",
  name: "",
  description: "",
  status: "DRAFT",
  variantsJson: JSON.stringify(
    [
      {
        sku: "",
        name: "",
        priceAmount: "0",
        currencyCode: "ARS",
        availableQuantity: 0,
      },
    ],
    null,
    2,
  ),
  imagesJson: "[]",
};

export function ProductEditor({ products, onCreate, onUpdate }: ProductEditorProps) {
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [slug, setSlug] = useState(blankProductPayload.slug);
  const [name, setName] = useState(blankProductPayload.name);
  const [description, setDescription] = useState(blankProductPayload.description);
  const [status, setStatus] = useState(blankProductPayload.status);
  const [variantsJson, setVariantsJson] = useState(blankProductPayload.variantsJson);
  const [imagesJson, setImagesJson] = useState(blankProductPayload.imagesJson);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedProduct = useMemo(
    () => products.find((product) => product.id === selectedProductId) ?? null,
    [products, selectedProductId],
  );

  function populateForm(product: AdminProduct | null) {
    if (!product) {
      setSelectedProductId(null);
      setSlug(blankProductPayload.slug);
      setName(blankProductPayload.name);
      setDescription(blankProductPayload.description);
      setStatus(blankProductPayload.status);
      setVariantsJson(blankProductPayload.variantsJson);
      setImagesJson(blankProductPayload.imagesJson);
      setError(null);
      return;
    }

    setSelectedProductId(product.id);
    setSlug(product.slug);
    setName(product.name);
    setDescription(product.description ?? "");
    setStatus(product.status);
    setVariantsJson(
      JSON.stringify(
        product.variants.map((variant) => ({
          id: variant.id,
          sku: variant.sku,
          name: variant.name,
          priceAmount: variant.priceAmount,
          currencyCode: variant.currencyCode,
          availableQuantity: variant.inventoryItem?.availableQuantity ?? 0,
        })),
        null,
        2,
      ),
    );
    setImagesJson(
      JSON.stringify(
        product.images.map((image) => ({
          assetUrl: image.assetUrl,
          assetKey: image.assetKey,
          altText: image.altText,
          sortOrder: image.sortOrder,
        })),
        null,
        2,
      ),
    );
    setError(null);
  }

  async function handleSave() {
    if (isSaving) {
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const payload = {
        slug: slug.trim(),
        name: name.trim(),
        description: description.trim() || undefined,
        status,
        variants: parseVariantInputs(variantsJson),
        images: parseImageInputs(imagesJson),
      } satisfies AdminProductInput;

      if (selectedProductId) {
        await onUpdate(selectedProductId, payload);
      } else {
        await onCreate(payload);
      }

      if (!selectedProductId) {
        populateForm(null);
      }
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Product save failed.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <section className="grid gap-5 xl:grid-cols-[0.82fr_1.18fr]">
      <aside className="rounded-[1.75rem] border border-[var(--line-soft)] bg-white/78 p-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.3em] text-[var(--ink-soft)]">
              Product management
            </p>
            <h3 className="mt-3 text-2xl font-semibold tracking-[-0.04em] text-[var(--ink-strong)]">
              Catalog workspace
            </h3>
          </div>
          <button className="rounded-full border border-[var(--line-soft)] px-4 py-2 text-sm font-semibold" onClick={() => populateForm(null)} type="button">
            New product
          </button>
        </div>
        <div className="mt-5 space-y-3">
          {products.map((product) => (
            <button
              key={product.id}
              className={`w-full rounded-[1.2rem] border px-4 py-4 text-left transition ${selectedProduct?.id === product.id ? "border-[var(--brand-deep)] bg-[var(--surface-panel)]" : "border-[var(--line-soft)] bg-white/70"}`}
              onClick={() => populateForm(product)}
              type="button"
            >
              <p className="text-sm font-semibold text-[var(--ink-strong)]">{product.name}</p>
              <p className="mt-2 text-xs uppercase tracking-[0.24em] text-[var(--ink-soft)]">
                {product.status} · {product.variants.length} variants
              </p>
            </button>
          ))}
        </div>
      </aside>

      <article className="rounded-[1.75rem] border border-[var(--line-soft)] bg-[var(--surface-panel)] p-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.3em] text-[var(--ink-soft)]">
              Product editor
            </p>
            <h3 className="mt-3 text-2xl font-semibold tracking-[-0.04em] text-[var(--ink-strong)]">
              {selectedProduct ? `Editing ${selectedProduct.name}` : "Create a new product"}
            </h3>
          </div>
          {selectedProduct ? (
            <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-[var(--brand-deep)]">
              {selectedProduct.status}
            </span>
          ) : null}
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <label className="text-sm font-medium text-[var(--ink-strong)]">
            Product name
            <input className="mt-2 w-full rounded-[1rem] border border-[var(--line-soft)] bg-white px-4 py-3" onChange={(event) => setName(event.target.value)} value={name} />
          </label>
          <label className="text-sm font-medium text-[var(--ink-strong)]">
            Slug
            <input className="mt-2 w-full rounded-[1rem] border border-[var(--line-soft)] bg-white px-4 py-3" onChange={(event) => setSlug(event.target.value)} value={slug} />
          </label>
          <label className="text-sm font-medium text-[var(--ink-strong)] md:col-span-2">
            Description
            <textarea className="mt-2 min-h-28 w-full rounded-[1rem] border border-[var(--line-soft)] bg-white px-4 py-3" onChange={(event) => setDescription(event.target.value)} value={description} />
          </label>
          <label className="text-sm font-medium text-[var(--ink-strong)] md:col-span-2">
            Status
            <select className="mt-2 w-full rounded-[1rem] border border-[var(--line-soft)] bg-white px-4 py-3" onChange={(event) => setStatus(event.target.value)} value={status}>
              <option value="DRAFT">DRAFT</option>
              <option value="ACTIVE">ACTIVE</option>
              <option value="ARCHIVED">ARCHIVED</option>
            </select>
          </label>
          <label className="text-sm font-medium text-[var(--ink-strong)] md:col-span-2">
            Variants JSON
            <textarea className="mt-2 min-h-56 w-full rounded-[1rem] border border-[var(--line-soft)] bg-white px-4 py-3 font-mono text-xs" onChange={(event) => setVariantsJson(event.target.value)} value={variantsJson} />
          </label>
          <label className="text-sm font-medium text-[var(--ink-strong)] md:col-span-2">
            Images JSON
            <textarea className="mt-2 min-h-40 w-full rounded-[1rem] border border-[var(--line-soft)] bg-white px-4 py-3 font-mono text-xs" onChange={(event) => setImagesJson(event.target.value)} value={imagesJson} />
          </label>
        </div>

        <div className="mt-5 rounded-[1.25rem] border border-[var(--line-soft)] bg-white/70 p-4 text-sm leading-7 text-[var(--ink-muted)]">
          Use `availableQuantity` on each variant for inventory. Set status to `ARCHIVED` to retire a product from active operations.
        </div>
        {error ? <p className="mt-4 text-sm text-[var(--warning-copy)]">{error}</p> : null}
        <button className="mt-5 rounded-full bg-[var(--ink-strong)] px-5 py-3 text-sm font-semibold text-[var(--surface-base)] disabled:opacity-60" disabled={isSaving} onClick={() => void handleSave()} type="button">
          {isSaving ? "Saving product..." : selectedProduct ? "Save changes" : "Create product"}
        </button>
      </article>
    </section>
  );
}

function parseVariantInputs(input: string): ProductVariantInput[] {
  const parsed = JSON.parse(input) as unknown;

  if (!Array.isArray(parsed) || parsed.length === 0) {
    throw new Error("Variants JSON must describe at least one variant.");
  }

  return parsed.map((variant, index) => {
    if (!isRecord(variant)) {
      throw new Error(`Variant ${index + 1} must be an object.`);
    }

    const sku = readRequiredString(variant.sku, `Variant ${index + 1} SKU`);
    const name = readRequiredString(variant.name, `Variant ${index + 1} name`);
    const priceAmount = readRequiredString(
      variant.priceAmount,
      `Variant ${index + 1} price amount`,
    );
    const currencyCode = readRequiredString(
      variant.currencyCode,
      `Variant ${index + 1} currency code`,
    );
    const availableQuantity = readOptionalNumber(
      variant.availableQuantity,
      `Variant ${index + 1} available quantity`,
    );
    const id = readOptionalString(variant.id, `Variant ${index + 1} id`);

    return {
      ...(id ? { id } : {}),
      sku,
      name,
      priceAmount,
      currencyCode,
      ...(availableQuantity !== undefined ? { availableQuantity } : {}),
    } satisfies ProductVariantInput;
  });
}

function parseImageInputs(input: string): ProductImageInput[] {
  const parsed = JSON.parse(input) as unknown;

  if (!Array.isArray(parsed)) {
    throw new Error("Images JSON must be an array.");
  }

  return parsed.map((image, index) => {
    if (!isRecord(image)) {
      throw new Error(`Image ${index + 1} must be an object.`);
    }

    const assetUrl = readRequiredString(image.assetUrl, `Image ${index + 1} asset URL`);
    const assetKey = readOptionalString(image.assetKey, `Image ${index + 1} asset key`);
    const altText = readOptionalString(image.altText, `Image ${index + 1} alt text`);
    const sortOrder = readOptionalNumber(image.sortOrder, `Image ${index + 1} sort order`);

    return {
      assetUrl,
      ...(assetKey !== undefined ? { assetKey } : {}),
      ...(altText !== undefined ? { altText } : {}),
      ...(sortOrder !== undefined ? { sortOrder } : {}),
    } satisfies ProductImageInput;
  });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readRequiredString(value: unknown, label: string) {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`${label} must be a non-empty string.`);
  }

  return value.trim();
}

function readOptionalString(value: unknown, label: string) {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }

  if (typeof value !== "string") {
    throw new Error(`${label} must be a string.`);
  }

  return value.trim();
}

function readOptionalNumber(value: unknown, label: string) {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }

  if (typeof value !== "number" || Number.isNaN(value)) {
    throw new Error(`${label} must be a number.`);
  }

  return value;
}
