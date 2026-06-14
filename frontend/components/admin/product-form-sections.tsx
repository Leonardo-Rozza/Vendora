"use client";

import { useRef, useState } from "react";
import type { ChangeEvent, Dispatch, SetStateAction } from "react";
import { Button, Field, Input, Select, Textarea } from "@/components/ui";
import { createProductImageUploadSignature } from "@/lib/commerce/api";
import { uploadProductImageToCloudinary } from "@/lib/commerce/uploads";
import { appCopy } from "@/lib/copy/es-ar";

export type CategoryOption = {
  id: string;
  name: string;
  depth: number;
};

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
  categoryId: string;
  categoryOptions: CategoryOption[];
  description: string;
  images: EditableImage[];
  name: string;
  /** Existing product id; absent when creating, which disables direct upload. */
  productId: string | null;
  setCategoryId: Dispatch<SetStateAction<string>>;
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

const CARD_CLASSNAME =
  "rounded-card border border-line-soft bg-surface-panel p-[22px]";
const HEADING_CLASSNAME = "mb-[18px] text-base font-extrabold text-ink-strong";

export function ProductFormSections({
  categoryId,
  categoryOptions,
  description,
  images,
  name,
  productId,
  setCategoryId,
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
    <div className="flex flex-col gap-[18px]">
      <section className={CARD_CLASSNAME}>
        <h2 className={HEADING_CLASSNAME}>{copy.basics}</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <Field id="product-name" label={copy.name}>
            <Input
              onChange={(event) => setName(event.target.value)}
              value={name}
            />
          </Field>
          <Field id="product-slug" label={copy.slug}>
            <Input
              onChange={(event) => setSlug(event.target.value)}
              value={slug}
            />
          </Field>
          <Field className="md:col-span-2" id="product-description" label={copy.description}>
            <Textarea
              onChange={(event) => setDescription(event.target.value)}
              rows={3}
              value={description}
            />
          </Field>
        </div>
      </section>

      <section className={CARD_CLASSNAME}>
        <h2 className={HEADING_CLASSNAME}>{copy.merchandising}</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <Field id="product-status" label={copy.status}>
            <Select
              onChange={(event) => setStatus(event.target.value)}
              value={status}
            >
              <option value="DRAFT">DRAFT</option>
              <option value="ACTIVE">ACTIVE</option>
              <option value="ARCHIVED">ARCHIVED</option>
            </Select>
          </Field>
          <Field id="product-category" label={copy.category}>
            <Select
              onChange={(event) => setCategoryId(event.target.value)}
              value={categoryId}
            >
              <option value="">Sin categoria</option>
              {categoryOptions.map((option) => (
                <option key={option.id} value={option.id}>
                  {`${"  ".repeat(option.depth)}${option.name}`}
                </option>
              ))}
            </Select>
          </Field>
        </div>
      </section>

      <section className={CARD_CLASSNAME}>
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-base font-extrabold text-ink-strong">{copy.variants}</h2>
          <Button
            onClick={() => setVariants((current) => [...current, createEmptyVariant()])}
            size="sm"
            variant="secondary"
          >
            {copy.addVariant}
          </Button>
        </div>
        <div className="flex flex-col gap-3">
          {variants.map((variant, index) => (
            <div
              key={variant.id ?? `variant-${index}`}
              className="rounded-field border border-line-soft bg-surface-sand p-4"
            >
              <div className="mb-3 flex items-center justify-between gap-3">
                <p className="text-sm font-bold text-ink-strong">
                  Variante {index + 1}
                </p>
                {variants.length > 1 ? (
                  <button
                    className="text-sm font-semibold text-ink-muted outline-none hover:text-brand-deep focus-visible:underline"
                    onClick={() =>
                      setVariants((current) =>
                        current.filter((_, currentIndex) => currentIndex !== index),
                      )
                    }
                    type="button"
                  >
                    {copy.removeVariant}
                  </button>
                ) : null}
              </div>
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <Field id={`variant-${index}-name`} label={copy.variantName}>
                  <Input
                    onChange={(event) =>
                      setVariants((current) =>
                        updateVariant(current, index, { name: event.target.value }),
                      )
                    }
                    value={variant.name}
                  />
                </Field>
                <Field id={`variant-${index}-sku`} label={copy.variantSku}>
                  <Input
                    onChange={(event) =>
                      setVariants((current) =>
                        updateVariant(current, index, { sku: event.target.value }),
                      )
                    }
                    value={variant.sku}
                  />
                </Field>
                <Field id={`variant-${index}-price`} label={copy.variantPrice}>
                  <Input
                    onChange={(event) =>
                      setVariants((current) =>
                        updateVariant(current, index, {
                          priceAmount: event.target.value,
                        }),
                      )
                    }
                    value={variant.priceAmount}
                  />
                </Field>
                <Field id={`variant-${index}-currency`} label={copy.variantCurrency}>
                  <Input
                    onChange={(event) =>
                      setVariants((current) =>
                        updateVariant(current, index, {
                          currencyCode: event.target.value.toUpperCase(),
                        }),
                      )
                    }
                    value={variant.currencyCode}
                  />
                </Field>
              </div>
              <Field
                className="mt-4 md:max-w-52"
                id={`variant-${index}-stock`}
                label={copy.variantStock}
              >
                <Input
                  inputMode="numeric"
                  onChange={(event) =>
                    setVariants((current) =>
                      updateVariant(current, index, {
                        availableQuantity: Number(event.target.value || 0),
                      }),
                    )
                  }
                  value={String(variant.availableQuantity)}
                />
              </Field>
            </div>
          ))}
        </div>
      </section>

      <section className={CARD_CLASSNAME}>
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-base font-extrabold text-ink-strong">{copy.images}</h2>
          <Button
            onClick={() =>
              setImages((current) => [...current, createEmptyImage(current.length)])
            }
            size="sm"
            variant="secondary"
          >
            {copy.addImage}
          </Button>
        </div>
        <div className="flex flex-col gap-3">
          {images.map((image, index) => (
            <ImageRow
              key={`image-${index}`}
              image={image}
              index={index}
              productId={productId}
              setImages={setImages}
            />
          ))}
        </div>
      </section>
    </div>
  );
}

type ImageRowProps = {
  image: EditableImage;
  index: number;
  productId: string | null;
  setImages: Dispatch<SetStateAction<EditableImage[]>>;
};

function ImageRow({ image, index, productId, setImages }: ImageRowProps) {
  const copy = appCopy.adminProductEditor;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const canUpload = Boolean(productId);

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    // Reset so re-selecting the same file fires change again.
    event.target.value = "";

    if (!file || !productId) {
      return;
    }

    setIsUploading(true);
    setUploadError(null);

    try {
      const signature = await createProductImageUploadSignature(productId);
      const uploaded = await uploadProductImageToCloudinary(file, signature);
      setImages((current) =>
        updateImage(current, index, {
          assetUrl: uploaded.assetUrl,
          assetKey: uploaded.assetKey,
        }),
      );
    } catch (caughtError) {
      setUploadError(
        caughtError instanceof Error
          ? caughtError.message
          : copy.imageUploadError,
      );
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <div className="rounded-field border border-line-soft bg-surface-sand p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <p className="text-sm font-bold text-ink-strong">Imagen {index + 1}</p>
        <button
          className="text-sm font-semibold text-ink-muted outline-none hover:text-brand-deep focus-visible:underline"
          onClick={() =>
            setImages((current) =>
              current.filter((_, currentIndex) => currentIndex !== index),
            )
          }
          type="button"
        >
          {copy.removeImage}
        </button>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        {image.assetUrl.trim().length > 0 ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            alt={image.altText.trim() || copy.imagePreviewAlt}
            className="size-16 flex-shrink-0 rounded-[9px] border border-line-soft object-cover"
            src={image.assetUrl}
          />
        ) : (
          <span className="size-16 flex-shrink-0 rounded-[9px] bg-[repeating-linear-gradient(45deg,#f4ede0,#f4ede0_6px,#efe6d6_6px,#efe6d6_12px)]" />
        )}
        <div className="flex flex-col gap-1.5">
          <input
            accept="image/*"
            aria-label={`${copy.imageUpload} ${index + 1}`}
            className="sr-only"
            disabled={!canUpload || isUploading}
            id={`image-${index}-file`}
            onChange={(event) => void handleFileChange(event)}
            ref={fileInputRef}
            type="file"
          />
          <Button
            disabled={!canUpload || isUploading}
            onClick={() => fileInputRef.current?.click()}
            size="sm"
            variant="secondary"
          >
            {isUploading ? copy.imageUploading : copy.imageUpload}
          </Button>
          <p className="text-[12px] text-ink-soft">
            {canUpload ? copy.imageUploadHint : copy.imageUploadDisabledHint}
          </p>
        </div>
      </div>

      {uploadError ? (
        <p
          className="mb-3 flex items-center gap-1.5 text-[12.5px] font-medium text-danger-ink"
          role="alert"
        >
          <span
            aria-hidden
            className="grid size-3.5 flex-shrink-0 place-items-center rounded-full bg-danger-ink text-[10px] font-bold text-white"
          >
            !
          </span>
          {uploadError}
        </p>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Field
          className="xl:col-span-2"
          id={`image-${index}-url`}
          label={copy.imageUrl}
        >
          <Input
            onChange={(event) =>
              setImages((current) =>
                updateImage(current, index, { assetUrl: event.target.value }),
              )
            }
            value={image.assetUrl}
          />
        </Field>
        <Field id={`image-${index}-key`} label={copy.imageKey}>
          <Input
            onChange={(event) =>
              setImages((current) =>
                updateImage(current, index, { assetKey: event.target.value }),
              )
            }
            value={image.assetKey}
          />
        </Field>
        <Field id={`image-${index}-sort`} label={copy.imageSortOrder}>
          <Input
            inputMode="numeric"
            onChange={(event) =>
              setImages((current) =>
                updateImage(current, index, {
                  sortOrder: Number(event.target.value || 0),
                }),
              )
            }
            value={String(image.sortOrder)}
          />
        </Field>
        <Field
          className="md:col-span-2 xl:col-span-4"
          id={`image-${index}-alt`}
          label={copy.imageAlt}
        >
          <Input
            onChange={(event) =>
              setImages((current) =>
                updateImage(current, index, { altText: event.target.value }),
              )
            }
            value={image.altText}
          />
        </Field>
      </div>
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
