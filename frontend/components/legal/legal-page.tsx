import type { ReactNode } from "react";

/**
 * Layout de lectura para las páginas legales: ancho máximo cómodo (~720px),
 * encabezado con eyebrow + título y un cuerpo con tipografía legible. Usa los
 * tokens del sistema de diseño (surface/ink/brand/line, rounded-card).
 */
export function LegalPage({
  eyebrow,
  title,
  intro,
  updatedAt,
  children,
}: {
  eyebrow: string;
  title: string;
  intro?: ReactNode;
  updatedAt?: string;
  children: ReactNode;
}) {
  return (
    <main className="mx-auto w-full max-w-[45rem] px-6 py-12 sm:px-8 sm:py-16">
      <header>
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-ink-soft">
          {eyebrow}
        </p>
        <h1 className="mt-3 text-3xl font-extrabold tracking-[-0.02em] text-ink-strong sm:text-4xl">
          {title}
        </h1>
        {intro ? (
          <p className="mt-4 text-[15px] leading-relaxed text-ink-muted">
            {intro}
          </p>
        ) : null}
        {updatedAt ? (
          <p className="mt-3 text-[13px] text-ink-soft">
            Última actualización: {updatedAt}
          </p>
        ) : null}
      </header>
      <div className="mt-10 space-y-9">{children}</div>
    </main>
  );
}

/** Sección con título y contenido del cuerpo legal. */
export function LegalSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section>
      <h2 className="text-xl font-bold tracking-[-0.01em] text-ink-strong">
        {title}
      </h2>
      <div className="mt-3 space-y-3 text-[15px] leading-relaxed text-ink-muted">
        {children}
      </div>
    </section>
  );
}

/** Lista con viñetas con estilo del sistema. */
export function LegalList({ items }: { items: ReactNode[] }) {
  return (
    <ul className="space-y-2 pl-5">
      {items.map((item, index) => (
        <li
          key={index}
          className="list-disc text-[15px] leading-relaxed text-ink-muted marker:text-brand-deep"
        >
          {item}
        </li>
      ))}
    </ul>
  );
}

/**
 * Tabla de datos del vendedor reutilizable. Resalta los placeholders pendientes
 * de completar.
 */
export function SellerDataCard({
  rows,
}: {
  rows: { label: string; value: string }[];
}) {
  return (
    <dl className="overflow-hidden rounded-card border border-line-soft bg-surface-panel shadow-subtle">
      {rows.map((row, index) => (
        <div
          key={row.label}
          className={`flex flex-col gap-1 px-4 py-3 sm:flex-row sm:items-baseline sm:gap-4${
            index > 0 ? " border-t border-line-soft" : ""
          }`}
        >
          <dt className="font-mono text-[11px] uppercase tracking-[0.14em] text-ink-soft sm:w-40 sm:flex-shrink-0">
            {row.label}
          </dt>
          <dd className="text-[15px] text-ink-strong">{row.value}</dd>
        </div>
      ))}
    </dl>
  );
}
