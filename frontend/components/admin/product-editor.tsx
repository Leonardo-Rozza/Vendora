"use client";

import { useEffect, useMemo, useState } from "react";
import { ProductFormSections, createEmptyImage, createEmptyVariant, type CategoryOption, type EditableImage, type EditableVariant } from "@/components/admin/product-form-sections";
import { listAttributes, listCategoryTree } from "@/lib/commerce/api";
import type {
  AdminProduct,
  AdminProductInput,
  AttributeOption,
  CategoryNode,
} from "@/lib/contracts";
import { appCopy } from "@/lib/copy/es-ar";

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
  categoryId: "",
  variants: [createEmptyVariant()] as EditableVariant[],
  images: [createEmptyImage(0)] as EditableImage[],
};

function flattenCategoryTree(tree: CategoryNode[], depth = 0): CategoryOption[] {
  return tree.flatMap((node) => [
    { id: node.id, name: node.name, depth },
    ...flattenCategoryTree(node.children, depth + 1),
  ]);
}

export function ProductEditor({ products, onCreate, onUpdate }: ProductEditorProps) {
  const copy = appCopy.adminProductEditor;
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [slug, setSlug] = useState(blankProductPayload.slug);
  const [name, setName] = useState(blankProductPayload.name);
  const [description, setDescription] = useState(blankProductPayload.description);
  const [status, setStatus] = useState(blankProductPayload.status);
  const [categoryId, setCategoryId] = useState(blankProductPayload.categoryId);
  const [variants, setVariants] = useState<EditableVariant[]>(blankProductPayload.variants);
  const [images, setImages] = useState<EditableImage[]>(blankProductPayload.images);
  const [categoryOptions, setCategoryOptions] = useState<CategoryOption[]>([]);
  const [attributeOptions, setAttributeOptions] = useState<AttributeOption[]>([]);
  const [selectedAttributeValueIds, setSelectedAttributeValueIds] = useState<
    Set<string>
  >(new Set());
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    listCategoryTree()
      .then((tree) => {
        if (active) {
          setCategoryOptions(flattenCategoryTree(tree));
        }
      })
      .catch(() => {
        if (active) {
          setCategoryOptions([]);
        }
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    listAttributes()
      .then((attributes) => {
        if (active) {
          setAttributeOptions(attributes);
        }
      })
      .catch(() => {
        if (active) {
          setAttributeOptions([]);
        }
      });
    return () => {
      active = false;
    };
  }, []);

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
      setCategoryId(blankProductPayload.categoryId);
      setVariants([createEmptyVariant()]);
      setImages([createEmptyImage(0)]);
      setSelectedAttributeValueIds(new Set());
      setError(null);
      return;
    }

    setSelectedProductId(product.id);
    setSlug(product.slug);
    setName(product.name);
    setDescription(product.description ?? "");
    setStatus(product.status);
    setCategoryId(product.category?.id ?? "");
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
    setSelectedAttributeValueIds(
      resolveSelectedValueIds(product.attributes ?? [], attributeOptions),
    );
    setError(null);
  }

  function toggleAttributeValue(valueId: string) {
    setSelectedAttributeValueIds((current) => {
      const next = new Set(current);
      if (next.has(valueId)) {
        next.delete(valueId);
      } else {
        next.add(valueId);
      }
      return next;
    });
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
        ...(categoryId ? { categoryId } : {}),
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
        ...(selectedAttributeValueIds.size > 0
          ? { attributeValueIds: [...selectedAttributeValueIds] }
          : {}),
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
                    {product.category?.name ?? "Sin categoria"}
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
          categoryId={categoryId}
          categoryOptions={categoryOptions}
          description={description}
          images={images}
          name={name}
          setCategoryId={setCategoryId}
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

        {attributeOptions.length > 0 ? (
          <div className="mt-5 rounded-[1.25rem] border border-[var(--line-soft)] bg-white/70 p-4">
            <p className="font-mono text-xs uppercase tracking-[0.28em] text-[var(--ink-soft)]">
              {copy.attributesTitle}
            </p>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              {attributeOptions.map((attribute) => (
                <fieldset key={attribute.id} className="flex flex-col gap-2">
                  <legend className="text-sm font-semibold text-[var(--ink-strong)]">
                    {attribute.name}
                  </legend>
                  {attribute.values.map((value) => {
                    const inputId = `admin-attr-${attribute.slug}-${value.slug}`;
                    return (
                      <label
                        key={value.id}
                        className="flex items-center gap-2 text-sm text-[var(--ink-strong)]"
                        htmlFor={inputId}
                      >
                        <input
                          checked={selectedAttributeValueIds.has(value.id)}
                          className="h-4 w-4 rounded border-[var(--line-strong)] accent-[var(--brand-deep)]"
                          id={inputId}
                          onChange={() => toggleAttributeValue(value.id)}
                          type="checkbox"
                        />
                        {value.value}
                      </label>
                    );
                  })}
                </fieldset>
              ))}
            </div>
          </div>
        ) : null}

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

function resolveSelectedValueIds(
  attributes: { attributeSlug: string; valueSlug: string }[],
  options: AttributeOption[],
): Set<string> {
  const selected = new Set<string>();

  for (const attribute of attributes) {
    const option = options.find((entry) => entry.slug === attribute.attributeSlug);
    const value = option?.values.find(
      (candidate) => candidate.slug === attribute.valueSlug,
    );
    if (value) {
      selected.add(value.id);
    }
  }

  return selected;
}

function readRequiredString(value: string, label: string) {
  if (value.trim().length === 0) {
    throw new Error(`${label} es obligatorio.`);
  }

  return value.trim();
}
