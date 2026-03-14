"use client";

import type { Dispatch, SetStateAction } from "react";
import type { ProductCategory } from "@/lib/contracts";
import { PRODUCT_CATEGORIES } from "@/lib/contracts";
import { appCopy, getProductCategoryLabel } from "@/lib/copy/es-ar";

export type EditableVariant = {
  id?: string;
  sku: string;
  name: string;
  priceAmount: string;
  currencyCode: string;
  availableQuantity: number;
};

export type EditableImage = {
  assetUrl: string;
  assetKey: string;
  altText: string;
  sortOrder: number;
};

type ProductFormSectionsProps = {
  category: ProductCategory;
  description: string;
  images: EditableImage[];
  name: string;
  setCategory: Dispatch<SetStateAction<ProductCategory>>;
  setDescription: Dispatch<SetStateAction<string>>;
  setImages: Dispatch<SetStateAction<EditableImage[]>>;
  setName: Dispatch<SetStateAction<string>>;
  setSlug: Dispatch<SetStateAction<string>>;
  setStatus: Dispatch<SetStateAction<string>>;
  setVariants: Dispatch<SetStateAction<EditableVariant[]>>;
  slug: string;
  status: string;
  variants: EditableVariant[];
};

export function ProductFormSections({
  category,
  description,
  images,
  name,
  setCategory,
  setDescription,
  setImages,
  setName,
  setSlug,
  setStatus,
  setVariants,
  slug,
  status,
  variants,
}: ProductFormSectionsProps) {
  const copy = appCopy.adminProductEditor;

  return (
    <div className="mt-6 space-y-5">
      <section className="rounded-[1.5rem] border border-[var(--line-soft)] bg-white/72 p-5">
        <p className="font-mono text-xs uppercase tracking-[0.28em] text-[var(--ink-soft)]">{copy.basics}</p>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <label className="text-sm font-medium text-[var(--ink-strong)]">
            {copy.name}
            <input className="mt-2 w-full rounded-[1rem] border border-[var(--line-soft)] bg-white px-4 py-3" onChange={(event) => setName(event.target.value)} value={name} />
          </label>
          <label className="text-sm font-medium text-[var(--ink-strong)]">
            {copy.slug}
            <input className="mt-2 w-full rounded-[1rem] border border-[var(--line-soft)] bg-white px-4 py-3" onChange={(event) => setSlug(event.target.value)} value={slug} />
          </label>
          <label className="text-sm font-medium text-[var(--ink-strong)] md:col-span-2">
            {copy.description}
            <textarea className="mt-2 min-h-28 w-full rounded-[1rem] border border-[var(--line-soft)] bg-white px-4 py-3" onChange={(event) => setDescription(event.target.value)} value={description} />
          </label>
        </div>
      </section>

      <section className="rounded-[1.5rem] border border-[var(--line-soft)] bg-white/72 p-5">
        <p className="font-mono text-xs uppercase tracking-[0.28em] text-[var(--ink-soft)]">{copy.merchandising}</p>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <label className="text-sm font-medium text-[var(--ink-strong)]">
            {copy.status}
            <select className="mt-2 w-full rounded-[1rem] border border-[var(--line-soft)] bg-white px-4 py-3" onChange={(event) => setStatus(event.target.value)} value={status}>
              <option value="DRAFT">DRAFT</option>
              <option value="ACTIVE">ACTIVE</option>
              <option value="ARCHIVED">ARCHIVED</option>
            </select>
          </label>
          <label className="text-sm font-medium text-[var(--ink-strong)]">
            {copy.category}
            <select className="mt-2 w-full rounded-[1rem] border border-[var(--line-soft)] bg-white px-4 py-3" onChange={(event) => setCategory(event.target.value as ProductCategory)} value={category}>
              {PRODUCT_CATEGORIES.map((option) => (
                <option key={option} value={option}>
                  {getProductCategoryLabel(option)}
                </option>
              ))}
            </select>
          </label>
        </div>
      </section>

      <section className="rounded-[1.5rem] border border-[var(--line-soft)] bg-white/72 p-5">
        <div className="flex items-center justify-between gap-3">
          <p className="font-mono text-xs uppercase tracking-[0.28em] text-[var(--ink-soft)]">{copy.variants}</p>
          <button className="rounded-full border border-[var(--line-soft)] px-4 py-2 text-sm font-semibold" onClick={() => setVariants((current) => [...current, createEmptyVariant()])} type="button">
            {copy.addVariant}
          </button>
        </div>
        <div className="mt-4 space-y-4">
          {variants.map((variant, index) => (
            <div key={variant.id ?? `variant-${index}`} className="rounded-[1.25rem] border border-[var(--line-soft)] bg-white p-4">
              <div className="mb-3 flex items-center justify-between gap-3">
                <p className="text-sm font-semibold text-[var(--ink-strong)]">Variante {index + 1}</p>
                {variants.length > 1 ? (
                  <button className="text-sm font-semibold text-[var(--ink-muted)]" onClick={() => setVariants((current) => current.filter((_, currentIndex) => currentIndex !== index))} type="button">
                    {copy.removeVariant}
                  </button>
                ) : null}
              </div>
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <label className="text-sm font-medium text-[var(--ink-strong)]">
                  {copy.variantName}
                  <input className="mt-2 w-full rounded-[1rem] border border-[var(--line-soft)] bg-[var(--surface-panel)] px-4 py-3" onChange={(event) => setVariants((current) => updateVariant(current, index, { name: event.target.value }))} value={variant.name} />
                </label>
                <label className="text-sm font-medium text-[var(--ink-strong)]">
                  {copy.variantSku}
                  <input className="mt-2 w-full rounded-[1rem] border border-[var(--line-soft)] bg-[var(--surface-panel)] px-4 py-3" onChange={(event) => setVariants((current) => updateVariant(current, index, { sku: event.target.value }))} value={variant.sku} />
                </label>
                <label className="text-sm font-medium text-[var(--ink-strong)]">
                  {copy.variantPrice}
                  <input className="mt-2 w-full rounded-[1rem] border border-[var(--line-soft)] bg-[var(--surface-panel)] px-4 py-3" onChange={(event) => setVariants((current) => updateVariant(current, index, { priceAmount: event.target.value }))} value={variant.priceAmount} />
                </label>
                <label className="text-sm font-medium text-[var(--ink-strong)]">
                  {copy.variantCurrency}
                  <input className="mt-2 w-full rounded-[1rem] border border-[var(--line-soft)] bg-[var(--surface-panel)] px-4 py-3" onChange={(event) => setVariants((current) => updateVariant(current, index, { currencyCode: event.target.value.toUpperCase() }))} value={variant.currencyCode} />
                </label>
              </div>
              <label className="mt-4 block text-sm font-medium text-[var(--ink-strong)] md:max-w-52">
                {copy.variantStock}
                <input className="mt-2 w-full rounded-[1rem] border border-[var(--line-soft)] bg-[var(--surface-panel)] px-4 py-3" inputMode="numeric" onChange={(event) => setVariants((current) => updateVariant(current, index, { availableQuantity: Number(event.target.value || 0) }))} value={String(variant.availableQuantity)} />
              </label>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-[1.5rem] border border-[var(--line-soft)] bg-white/72 p-5">
        <div className="flex items-center justify-between gap-3">
          <p className="font-mono text-xs uppercase tracking-[0.28em] text-[var(--ink-soft)]">{copy.images}</p>
          <button className="rounded-full border border-[var(--line-soft)] px-4 py-2 text-sm font-semibold" onClick={() => setImages((current) => [...current, createEmptyImage(current.length)])} type="button">
            {copy.addImage}
          </button>
        </div>
        <div className="mt-4 space-y-4">
          {images.map((image, index) => (
            <div key={`${image.assetUrl}-${index}`} className="rounded-[1.25rem] border border-[var(--line-soft)] bg-white p-4">
              <div className="mb-3 flex items-center justify-between gap-3">
                <p className="text-sm font-semibold text-[var(--ink-strong)]">Imagen {index + 1}</p>
                <button className="text-sm font-semibold text-[var(--ink-muted)]" onClick={() => setImages((current) => current.filter((_, currentIndex) => currentIndex !== index))} type="button">
                  {copy.removeImage}
                </button>
              </div>
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <label className="text-sm font-medium text-[var(--ink-strong)] xl:col-span-2">
                  {copy.imageUrl}
                  <input className="mt-2 w-full rounded-[1rem] border border-[var(--line-soft)] bg-[var(--surface-panel)] px-4 py-3" onChange={(event) => setImages((current) => updateImage(current, index, { assetUrl: event.target.value }))} value={image.assetUrl} />
                </label>
                <label className="text-sm font-medium text-[var(--ink-strong)]">
                  {copy.imageKey}
                  <input className="mt-2 w-full rounded-[1rem] border border-[var(--line-soft)] bg-[var(--surface-panel)] px-4 py-3" onChange={(event) => setImages((current) => updateImage(current, index, { assetKey: event.target.value }))} value={image.assetKey} />
                </label>
                <label className="text-sm font-medium text-[var(--ink-strong)]">
                  {copy.imageSortOrder}
                  <input className="mt-2 w-full rounded-[1rem] border border-[var(--line-soft)] bg-[var(--surface-panel)] px-4 py-3" inputMode="numeric" onChange={(event) => setImages((current) => updateImage(current, index, { sortOrder: Number(event.target.value || 0) }))} value={String(image.sortOrder)} />
                </label>
                <label className="text-sm font-medium text-[var(--ink-strong)] md:col-span-2 xl:col-span-4">
                  {copy.imageAlt}
                  <input className="mt-2 w-full rounded-[1rem] border border-[var(--line-soft)] bg-[var(--surface-panel)] px-4 py-3" onChange={(event) => setImages((current) => updateImage(current, index, { altText: event.target.value }))} value={image.altText} />
                </label>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function updateVariant(variants: EditableVariant[], index: number, patch: Partial<EditableVariant>) {
  return variants.map((variant, currentIndex) =>
    currentIndex === index ? { ...variant, ...patch } : variant,
  );
}

function updateImage(images: EditableImage[], index: number, patch: Partial<EditableImage>) {
  return images.map((image, currentIndex) =>
    currentIndex === index ? { ...image, ...patch } : image,
  );
}

export function createEmptyVariant(): EditableVariant {
  return {
    sku: "",
    name: "",
    priceAmount: "0",
    currencyCode: "ARS",
    availableQuantity: 0,
  };
}

export function createEmptyImage(sortOrder = 0): EditableImage {
  return {
    assetUrl: "",
    assetKey: "",
    altText: "",
    sortOrder,
  };
}
