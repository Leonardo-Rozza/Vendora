"use client";

import { createContext, useContext, useId } from "react";
import type { ReactNode } from "react";
import { cn } from "./cn";

type FieldContextValue = {
  controlId: string;
  describedById?: string;
  invalid: boolean;
  required: boolean;
};

const FieldContext = createContext<FieldContextValue | null>(null);

/**
 * Props a form control inside a <Field> should spread on itself to inherit the
 * field's id, aria-describedby, aria-invalid and required. Returns {} when the
 * control is used standalone (outside a Field).
 */
export function useFieldControl() {
  const context = useContext(FieldContext);

  if (!context) {
    return {};
  }

  return {
    id: context.controlId,
    "aria-describedby": context.describedById,
    "aria-invalid": context.invalid || undefined,
    required: context.required || undefined,
  };
}

export function Field({
  label,
  error,
  hint,
  required = false,
  className,
  children,
  id,
}: {
  label: string;
  error?: string | null;
  hint?: string;
  required?: boolean;
  className?: string;
  children: ReactNode;
  id?: string;
}) {
  const generatedId = useId();
  const controlId = id ?? generatedId;
  const describedById = error
    ? `${controlId}-error`
    : hint
      ? `${controlId}-hint`
      : undefined;

  return (
    <FieldContext.Provider
      value={{ controlId, describedById, invalid: Boolean(error), required }}
    >
      <div className={cn("flex flex-col gap-2", className)}>
        <label
          className="text-[13px] font-semibold text-ink-strong"
          htmlFor={controlId}
        >
          {label}
          {required ? (
            <span aria-hidden className="text-brand-deep">
              {" "}
              *
            </span>
          ) : null}
        </label>
        {children}
        {hint && !error ? (
          <p className="text-[12.5px] text-ink-soft" id={`${controlId}-hint`}>
            {hint}
          </p>
        ) : null}
        {error ? (
          <p
            className="flex items-center gap-1.5 text-[12.5px] font-medium text-danger-ink"
            id={`${controlId}-error`}
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
      </div>
    </FieldContext.Provider>
  );
}
