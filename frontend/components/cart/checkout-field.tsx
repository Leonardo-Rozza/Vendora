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
  "mt-2 w-full rounded-full border border-white/14 bg-white/10 px-4 py-3 text-sm text-white outline-none placeholder:text-white/44";

const textareaClassName =
  "mt-2 min-h-24 w-full rounded-[1.5rem] border border-white/14 bg-white/10 px-4 py-3 text-sm text-white outline-none placeholder:text-white/44";

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
      <label className="block text-sm text-white/76" htmlFor={id}>
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
          className="mt-2 text-sm text-[var(--accent-sand)]"
          id={errorId}
          role="alert"
        >
          {error}
        </p>
      ) : null}
    </div>
  );
}
