"use client";

type CheckoutFieldProps = {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  placeholder?: string;
  required?: boolean;
  error?: string | null;
  className?: string;
  multiline?: boolean;
};

const inputClassName =
  "mt-[7px] w-full rounded-[10px] border-[1.5px] border-line-strong bg-surface-panel px-[14px] py-3 text-[15px] text-ink-strong outline-none transition placeholder:text-ink-faint focus-visible:border-brand-deep focus-visible:outline-3 focus-visible:outline-offset-0 focus-visible:outline-[#e7cfae] aria-[invalid]:border-danger-ink aria-[invalid]:text-danger-ink";

const textareaClassName =
  "mt-[7px] min-h-24 w-full resize-y rounded-[10px] border-[1.5px] border-line-strong bg-surface-panel px-[14px] py-3 text-[15px] text-ink-strong outline-none transition placeholder:text-ink-faint focus-visible:border-brand-deep focus-visible:outline-3 focus-visible:outline-offset-0 focus-visible:outline-[#e7cfae] aria-[invalid]:border-danger-ink aria-[invalid]:text-danger-ink";

export function Field({
  id,
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  required,
  error,
  className,
  multiline,
}: CheckoutFieldProps) {
  const errorId = error ? `${id}-error` : undefined;

  return (
    <div className={className}>
      <label
        className="block text-[13px] font-semibold text-ink-strong"
        htmlFor={id}
      >
        {label}
        {multiline ? (
          <textarea
            aria-describedby={errorId}
            aria-invalid={error ? true : undefined}
            className={textareaClassName}
            id={id}
            onChange={(event) => onChange(event.target.value)}
            placeholder={placeholder}
            required={required}
            value={value}
          />
        ) : (
          <input
            aria-describedby={errorId}
            aria-invalid={error ? true : undefined}
            className={inputClassName}
            id={id}
            onChange={(event) => onChange(event.target.value)}
            placeholder={placeholder}
            required={required}
            type={type}
            value={value}
          />
        )}
      </label>
      {error ? (
        <p
          className="mt-[7px] flex items-center gap-[6px] text-[12.5px] font-semibold text-danger-ink"
          id={errorId}
          role="alert"
        >
          {error}
        </p>
      ) : null}
    </div>
  );
}
