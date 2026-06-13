"use client";

import type { CheckoutFormState } from "@/lib/contracts";
import type { appCopy } from "@/lib/copy/es-ar";
import { Field } from "@/components/cart/checkout-field";

type CartCopy = (typeof appCopy)["cart"];

type CheckoutFormProps = {
  copy: CartCopy;
  value: CheckoutFormState;
  onChange: (
    update: (current: CheckoutFormState) => CheckoutFormState,
  ) => void;
  error: string | null;
  isSubmitting: boolean;
  onSubmit: () => void;
};

export function CheckoutForm({
  copy,
  value,
  onChange,
  error,
  isSubmitting,
  onSubmit,
}: CheckoutFormProps) {
  function updateField(field: keyof CheckoutFormState) {
    return (fieldValue: string) =>
      onChange((current) => ({ ...current, [field]: fieldValue }));
  }

  return (
    <>
      <div className="mt-5 grid gap-4">
        <p className="font-mono text-xs uppercase tracking-[0.24em] text-[var(--accent-sand)]">
          {copy.contactSection}
        </p>
        <Field
          id="checkout-full-name"
          label={copy.fullName}
          onChange={updateField("fullName")}
          placeholder="Ada Buyer"
          value={value.fullName}
        />
        <Field
          id="checkout-email"
          label={copy.email}
          onChange={updateField("email")}
          placeholder="ada@example.com"
          type="email"
          value={value.email}
        />
        <Field
          id="checkout-phone"
          label={copy.phone}
          onChange={updateField("phone")}
          placeholder="11 5555 5555"
          value={value.phone}
        />
      </div>

      <div className="mt-5 grid gap-4">
        <p className="font-mono text-xs uppercase tracking-[0.24em] text-[var(--accent-sand)]">
          {copy.shippingSection}
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            id="checkout-recipient-name"
            label={copy.recipientName}
            onChange={updateField("recipientName")}
            placeholder="Quien recibe el pedido"
            value={value.recipientName}
          />
          <Field
            id="checkout-shipping-phone"
            label={copy.shippingPhone}
            onChange={updateField("shippingPhone")}
            placeholder="Contacto para la entrega"
            value={value.shippingPhone}
          />
        </div>
        <Field
          id="checkout-street-line1"
          label={copy.streetAddress}
          onChange={updateField("streetLine1")}
          placeholder={copy.streetAddressHint}
          value={value.streetLine1}
        />
        <Field
          id="checkout-street-line2"
          label={copy.addressLine2}
          onChange={updateField("streetLine2")}
          placeholder="Torre, piso, puerta o referencia extra"
          value={value.streetLine2}
        />
        <div className="grid gap-4 sm:grid-cols-3">
          <Field
            className="sm:col-span-2"
            id="checkout-locality"
            label={copy.locality}
            onChange={updateField("locality")}
            placeholder="CABA, Vicente Lopez, Quilmes..."
            value={value.locality}
          />
          <Field
            id="checkout-postal-code"
            label={copy.postalCode}
            onChange={updateField("postalCode")}
            placeholder="C1425"
            value={value.postalCode}
          />
        </div>
        <Field
          id="checkout-province"
          label={copy.province}
          onChange={updateField("province")}
          placeholder="CABA o Buenos Aires"
          value={value.province}
        />
        <Field
          id="checkout-delivery-notes"
          label={copy.deliveryNotes}
          multiline
          onChange={updateField("deliveryNotes")}
          placeholder="Horario, timbre o referencia de entrega"
          value={value.deliveryNotes}
        />
      </div>

      <p className="mt-4 text-xs uppercase tracking-[0.24em] text-white/56">
        {copy.ambaOnly}
      </p>
      {error ? (
        <p className="mt-4 text-sm text-[var(--accent-sand)]" role="alert">
          {error}
        </p>
      ) : null}
      <button
        className="mt-5 w-full rounded-full bg-[var(--surface-base)] px-5 py-3 text-sm font-semibold text-[var(--ink-strong)] transition-transform hover:-translate-y-0.5 disabled:translate-y-0 disabled:opacity-60"
        disabled={isSubmitting}
        onClick={onSubmit}
        type="button"
      >
        {isSubmitting ? copy.preparing : copy.continueToPayment}
      </button>
    </>
  );
}
