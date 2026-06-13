import { cn } from "./cn";

export function Spinner({
  className,
  label = "Cargando",
}: {
  className?: string;
  label?: string;
}) {
  return (
    <span role="status" className="inline-flex items-center">
      <span
        aria-hidden
        className={cn(
          "size-5 animate-spin rounded-full border-2 border-line-strong border-t-brand-deep",
          className,
        )}
      />
      <span className="sr-only">{label}</span>
    </span>
  );
}
