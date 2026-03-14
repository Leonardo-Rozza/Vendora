"use client";

import { useMemo, useState } from "react";
import { ProductFormSections, createEmptyImage, createEmptyVariant, type EditableImage, type EditableVariant } from "@/components/admin/product-form-sections";
import type { AdminProduct, AdminProductInput, ProductCategory } from "@/lib/contracts";
import { appCopy, getProductCategoryLabel } from "@/lib/copy/es-ar";

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
  category: "ELECTRONICA" as ProductCategory,
  variants: [createEmptyVariant()] as EditableVariant[],
  images: [createEmptyImage(0)] as EditableImage[],
};

export function ProductEditor({ products, onCreate, onUpdate }: ProductEditorProps) {
  const copy = appCopy.adminProductEditor;
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [slug, setSlug] = useState(blankProductPayload.slug);
  const [name, setName] = useState(blankProductPayload.name);
  const [description, setDescription] = useState(blankProductPayload.description);
  const [status, setStatus] = useState(blankProductPayload.status);
  const [category, setCategory] = useState<ProductCategory>(blankProductPayload.category);
  const [variants, setVariants] = useState<EditableVariant[]>(blankProductPayload.variants);
  const [images, setImages] = useState<EditableImage[]>(blankProductPayload.images);
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
      setCategory(blankProductPayload.category);
      setVariants([createEmptyVariant()]);
      setImages([createEmptyImage(0)]);
      setError(null);
      return;
    }

    setSelectedProductId(product.id);
    setSlug(product.slug);
    setName(product.name);
    setDescription(product.description ?? "");
    setStatus(product.status);
    setCategory(product.category ?? blankProductPayload.category);
    setVariants(
      product.variants.map((variant) => ({
        id: variant.id,
        sku: variant.sku,
        name: variant.name,
        priceAmount: variant.priceAmount,
        currencyCode: variant.currencyCode,
        availableQuantity: variant.inventoryItem?.availableQuantity ?? 0,
      })),
    );
    setImages(
      product.images.length > 0
        ? product.images.map((image) => ({
            assetUrl: image.assetUrl,
            assetKey: image.assetKey ?? "",
            altText: image.altText ?? "",
            sortOrder: image.sortOrder,
          }))
        : [createEmptyImage(0)],
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
        slug: readRequiredString(slug, copy.slug),
        name: readRequiredString(name, copy.name),
        description: description.trim() || undefined,
        status,
        category,
        variants: variants.map((variant, index) => ({
          ...(variant.id ? { id: variant.id } : {}),
          sku: readRequiredString(variant.sku, `${copy.variantSku} ${index + 1}`),
          name: readRequiredString(variant.name, `${copy.variantName} ${index + 1}`),
          priceAmount: readRequiredString(variant.priceAmount, `${copy.variantPrice} ${index + 1}`),
          currencyCode: readRequiredString(variant.currencyCode, `${copy.variantCurrency} ${index + 1}`).toUpperCase(),
          availableQuantity: Number.isFinite(variant.availableQuantity) ? variant.availableQuantity : 0,
        })),
        images: images
          .filter((image) => image.assetUrl.trim().length > 0)
          .map((image) => ({
            assetUrl: image.assetUrl.trim(),
            assetKey: image.assetKey.trim() || undefined,
            altText: image.altText.trim() || undefined,
            sortOrder: image.sortOrder,
          })),
      } satisfies AdminProductInput;

      if (payload.variants.length === 0) {
        throw new Error("Debes cargar al menos una variante.");
      }

      if (selectedProductId) {
        await onUpdate(selectedProductId, payload);
      } else {
        await onCreate(payload);
      }

      if (!selectedProductId) {
        populateForm(null);
      }
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "No pudimos guardar el producto.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <section className="grid gap-5 xl:grid-cols-[0.78fr_1.22fr]" id="admin-productos">
      <aside className="rounded-[1.75rem] border border-[var(--line-soft)] bg-white/78 p-5 xl:sticky xl:top-24 xl:self-start">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.3em] text-[var(--ink-soft)]">{copy.workspaceEyebrow}</p>
            <h3 className="mt-3 text-2xl font-semibold tracking-[-0.04em] text-[var(--ink-strong)]">{copy.workspaceTitle}</h3>
            <p className="mt-3 text-sm leading-7 text-[var(--ink-muted)]">{copy.workspaceDescription}</p>
          </div>
          <button className="rounded-full border border-[var(--line-soft)] px-4 py-2 text-sm font-semibold" onClick={() => populateForm(null)} type="button">
            {copy.newProduct}
          </button>
        </div>
        <div className="mt-5 space-y-3">
          {products.length === 0 ? (
            <div className="rounded-[1.2rem] border border-dashed border-[var(--line-soft)] bg-white/70 px-4 py-5 text-sm text-[var(--ink-muted)]">
              {copy.emptyProducts}
            </div>
          ) : null}
          {products.map((product) => (
            <button
              key={product.id}
              className={`w-full rounded-[1.2rem] border px-4 py-4 text-left transition ${selectedProduct?.id === product.id ? "border-[var(--brand-deep)] bg-[var(--surface-panel)]" : "border-[var(--line-soft)] bg-white/70"}`}
              onClick={() => populateForm(product)}
              type="button"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-[var(--ink-strong)]">{product.name}</p>
                  <p className="mt-2 text-xs uppercase tracking-[0.24em] text-[var(--ink-soft)]">
                    {getProductCategoryLabel(product.category ?? blankProductPayload.category)}
                  </p>
                </div>
                <span className="rounded-full border border-[var(--line-soft)] bg-white px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--brand-deep)]">
                  {product.status}
                </span>
              </div>
              <p className="mt-3 text-sm text-[var(--ink-muted)]">{product.variants.length} variantes cargadas</p>
            </button>
          ))}
        </div>
      </aside>

      <article className="rounded-[1.75rem] border border-[var(--line-soft)] bg-[var(--surface-panel)] p-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.3em] text-[var(--ink-soft)]">Edicion guiada</p>
            <h3 className="mt-3 text-2xl font-semibold tracking-[-0.04em] text-[var(--ink-strong)]">
              {selectedProduct ? `${copy.editTitle}: ${selectedProduct.name}` : copy.createTitle}
            </h3>
          </div>
          <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-[var(--brand-deep)]">
            {selectedProduct ? selectedProduct.status : copy.draftLabel}
          </span>
        </div>

        <ProductFormSections
          category={category}
          description={description}
          images={images}
          name={name}
          setCategory={setCategory}
          setDescription={setDescription}
          setImages={setImages}
          setName={setName}
          setSlug={setSlug}
          setStatus={setStatus}
          setVariants={setVariants}
          slug={slug}
          status={status}
          variants={variants}
        />

        <div className="mt-5 rounded-[1.25rem] border border-[var(--line-soft)] bg-white/70 p-4 text-sm leading-7 text-[var(--ink-muted)]">
          {copy.helper}
        </div>
        {error ? <p className="mt-4 text-sm text-[var(--brand-deep)]">{error}</p> : null}
        <button className="mt-5 rounded-full bg-[var(--ink-strong)] px-5 py-3 text-sm font-semibold text-[var(--surface-base)] disabled:opacity-60" disabled={isSaving} onClick={() => void handleSave()} type="button">
          {isSaving ? copy.saving : selectedProduct ? copy.saveChanges : copy.createProduct}
        </button>
      </article>
    </section>
  );
}

function readRequiredString(value: string, label: string) {
  if (value.trim().length === 0) {
    throw new Error(`${label} es obligatorio.`);
  }

  return value.trim();
}
