"use client";

import { useEffect, useMemo, useState } from "react";
import { ProductFormSections, createEmptyImage, createEmptyVariant, type CategoryOption, type EditableImage, type EditableVariant } from "@/components/admin/product-form-sections";
import { listAttributes, listCategoryTree } from "@/lib/commerce/api";
import { formatMoney } from "@/lib/commerce/format";
import { Badge, Button, Pagination } from "@/components/ui";
import type {
  AdminProduct,
  AdminProductInput,
  AttributeOption,
  CategoryNode,
} from "@/lib/contracts";
import { appCopy } from "@/lib/copy/es-ar";

const PRODUCTS_PER_PAGE = 10;

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

function productPrice(product: AdminProduct): string {
  const firstVariant = product.variants[0];
  if (!firstVariant) {
    return "—";
  }
  return formatMoney(firstVariant.priceAmount, firstVariant.currencyCode);
}

function productStock(product: AdminProduct): number {
  return product.variants.reduce(
    (total, variant) =>
      total +
      (variant.inventoryItem?.availableQuantity ??
        variant.availableQuantity ??
        0),
    0,
  );
}

const STATUS_TONE: Record<string, "success" | "neutral"> = {
  ACTIVE: "success",
};

export function ProductEditor({ products, onCreate, onUpdate }: ProductEditorProps) {
  const copy = appCopy.adminProductEditor;
  const [view, setView] = useState<"list" | "edit">("list");
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
  const [listPage, setListPage] = useState(1);

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
      setView("edit");
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
    setView("edit");
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

      populateForm(null);
      setView("list");
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "No pudimos guardar el producto.");
    } finally {
      setIsSaving(false);
    }
  }

  if (view === "list") {
    const activeCount = products.filter(
      (product) => product.status === "ACTIVE",
    ).length;

    const pageCount = Math.max(1, Math.ceil(products.length / PRODUCTS_PER_PAGE));
    const currentPage = Math.min(listPage, pageCount);
    const pagedProducts = products.slice(
      (currentPage - 1) * PRODUCTS_PER_PAGE,
      currentPage * PRODUCTS_PER_PAGE,
    );

    return (
      <section id="admin-productos">
        <div className="mb-2 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-[26px] font-extrabold tracking-[-0.02em] text-ink-strong">
              {copy.listTitle}
            </h1>
            <p className="mt-1 text-sm text-ink-soft">
              {products.length} {copy.productsSuffix} · {activeCount} {copy.activeSuffix}
            </p>
          </div>
          <Button onClick={() => populateForm(null)} size="sm">
            + {copy.newProduct}
          </Button>
        </div>

        <div className="mt-[18px] overflow-hidden rounded-card border border-line-soft bg-surface-panel">
          {products.length === 0 ? (
            <div className="px-5 py-8 text-sm text-ink-muted">
              {copy.emptyProducts}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] border-collapse text-left">
                <thead>
                  <tr className="bg-surface-muted/60">
                    {[
                      copy.colProduct,
                      copy.colCategory,
                      copy.colPrice,
                      copy.colStock,
                      copy.colStatus,
                    ].map((heading) => (
                      <th
                        key={heading}
                        className="px-[18px] py-[13px] font-mono text-[11px] font-bold uppercase tracking-[0.1em] text-ink-soft"
                      >
                        {heading}
                      </th>
                    ))}
                    <th className="px-[18px] py-[13px]">
                      <span className="sr-only">{copy.colActions}</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {pagedProducts.map((product) => {
                    const stock = productStock(product);
                    const isOut = stock === 0;
                    const isLow = stock > 0 && stock <= 3;

                    return (
                      <tr
                        key={product.id}
                        className="border-t border-line-soft/80"
                      >
                        <td className="px-[18px] py-3">
                          <div className="flex items-center gap-3">
                            <span className="size-[42px] flex-shrink-0 rounded-[9px] bg-[repeating-linear-gradient(45deg,#f4ede0,#f4ede0_6px,#efe6d6_6px,#efe6d6_12px)]" />
                            <div>
                              <div className="text-sm font-bold leading-tight text-ink-strong">
                                {product.name}
                              </div>
                              <div className="mt-0.5 font-mono text-[11px] text-ink-faint">
                                {product.variants[0]?.sku ?? "—"}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-[18px] py-3 text-[13.5px] text-ink-muted">
                          {product.category?.name ?? "—"}
                        </td>
                        <td className="whitespace-nowrap px-[18px] py-3 text-sm font-bold text-ink-strong">
                          {productPrice(product)}
                        </td>
                        <td className="px-[18px] py-3">
                          <Badge
                            tone={isOut ? "danger" : isLow ? "warning" : "success"}
                          >
                            {isOut
                              ? copy.stockOut
                              : `${stock} ${copy.stockUnit}`}
                          </Badge>
                        </td>
                        <td className="px-[18px] py-3">
                          <Badge tone={STATUS_TONE[product.status] ?? "neutral"}>
                            {product.status}
                          </Badge>
                        </td>
                        <td className="px-[18px] py-3 text-right">
                          <Button
                            onClick={() => populateForm(product)}
                            size="sm"
                            variant="secondary"
                          >
                            {copy.edit}
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {pageCount > 1 ? (
          <div className="mt-5 flex justify-end">
            <Pagination
              page={currentPage}
              pageCount={pageCount}
              onPageChange={setListPage}
            />
          </div>
        ) : null}
      </section>
    );
  }

  return (
    <section id="admin-productos">
      <button
        className="mb-4 text-sm font-bold text-brand-deep outline-none focus-visible:underline"
        onClick={() => {
          populateForm(null);
          setView("list");
        }}
        type="button"
      >
        ← {copy.backToList}
      </button>

      <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-extrabold tracking-[-0.02em] text-ink-strong">
          {selectedProduct ? selectedProduct.name : copy.createTitle}
        </h1>
        <div className="flex items-center gap-2.5">
          <Badge tone={STATUS_TONE[status] ?? "neutral"}>{status}</Badge>
          <Button
            onClick={() => {
              populateForm(null);
              setView("list");
            }}
            variant="secondary"
          >
            {copy.cancel}
          </Button>
          <Button disabled={isSaving} onClick={() => void handleSave()}>
            {isSaving
              ? copy.saving
              : selectedProduct
                ? copy.saveChanges
                : copy.createProduct}
          </Button>
        </div>
      </div>

      <ProductFormSections
        categoryId={categoryId}
        categoryOptions={categoryOptions}
        description={description}
        images={images}
        name={name}
        productId={selectedProductId}
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
        <div className="mt-5 rounded-card border border-line-soft bg-surface-panel p-[22px]">
          <h2 className="text-base font-extrabold text-ink-strong">
            {copy.attributesTitle}
          </h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {attributeOptions.map((attribute) => (
              <fieldset key={attribute.id} className="flex flex-col gap-2">
                <legend className="text-sm font-semibold text-ink-strong">
                  {attribute.name}
                </legend>
                {attribute.values.map((value) => {
                  const inputId = `admin-attr-${attribute.slug}-${value.slug}`;
                  return (
                    <label
                      key={value.id}
                      className="flex items-center gap-2 text-sm text-ink-strong"
                      htmlFor={inputId}
                    >
                      <input
                        checked={selectedAttributeValueIds.has(value.id)}
                        className="size-4 rounded border-line-strong accent-brand-deep"
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

      <p className="mt-5 rounded-card border border-line-soft bg-surface-panel p-[22px] text-sm leading-7 text-ink-muted">
        {copy.helper}
      </p>

      {error ? (
        <p
          className="mt-4 flex items-center gap-1.5 text-[12.5px] font-medium text-danger-ink"
          role="alert"
        >
          <span
            aria-hidden
            className="grid size-3.5 flex-shrink-0 place-items-center rounded-full bg-danger-ink text-[10px] font-bold text-white"
          >
            !
          </span>
          {error}
        </p>
      ) : null}

      <div className="mt-5 flex flex-wrap justify-end gap-2.5">
        <Button
          onClick={() => {
            populateForm(null);
            setView("list");
          }}
          variant="secondary"
        >
          {copy.cancel}
        </Button>
        <Button disabled={isSaving} onClick={() => void handleSave()}>
          {isSaving
            ? copy.saving
            : selectedProduct
              ? copy.saveChanges
              : copy.createProduct}
        </Button>
      </div>
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
