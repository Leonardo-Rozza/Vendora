"use client";

import { useState } from "react";
import {
  Badge,
  Breadcrumb,
  Button,
  Card,
  Dialog,
  EmptyState,
  Field,
  Input,
  Pagination,
  Pill,
  Select,
  Skeleton,
  Spinner,
  Textarea,
} from "@/components/ui";

// Literal class strings so Tailwind v4 generates the utilities (it scans source
// for literal class names; `bg-${token}` would not be detected).
const COLOR_TOKENS: { token: string; className: string; ring?: boolean }[] = [
  { token: "surface-base", className: "bg-surface-base", ring: true },
  { token: "surface-panel", className: "bg-surface-panel", ring: true },
  { token: "surface-sand", className: "bg-surface-sand" },
  { token: "surface-muted", className: "bg-surface-muted" },
  { token: "ink-strong", className: "bg-ink-strong" },
  { token: "ink-muted", className: "bg-ink-muted" },
  { token: "ink-soft", className: "bg-ink-soft" },
  { token: "ink-faint", className: "bg-ink-faint" },
  { token: "brand-deep", className: "bg-brand-deep" },
  { token: "brand-hover", className: "bg-brand-hover" },
  { token: "brand-ink", className: "bg-brand-ink" },
  { token: "accent-sand", className: "bg-accent-sand" },
  { token: "accent-sky", className: "bg-accent-sky" },
  { token: "line-soft", className: "bg-line-soft" },
  { token: "line-strong", className: "bg-line-strong" },
  { token: "success-ink", className: "bg-success-ink" },
  { token: "warning-line", className: "bg-warning-line" },
  { token: "danger-ink", className: "bg-danger-ink" },
];

function Section({
  eyebrow,
  title,
  children,
}: {
  eyebrow?: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-4">
      {eyebrow ? (
        <p className="font-mono text-xs uppercase tracking-[0.18em] text-brand-deep">
          {eyebrow}
        </p>
      ) : null}
      <h2 className="text-2xl font-extrabold tracking-[-0.02em] text-ink-strong">
        {title}
      </h2>
      <div className="h-px bg-line-soft" />
      <div className="flex flex-col gap-4 pt-2">{children}</div>
    </section>
  );
}

export default function StyleguidePage() {
  const [page, setPage] = useState(3);
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-16 px-6 py-12 sm:px-8">
      <header className="rounded-panel bg-brand-ink px-8 py-10 text-[#fbefd9]">
        <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-accent-sand">
          Vendora · Sistema de diseño · v1
        </p>
        <h1 className="mt-3 text-4xl font-extrabold tracking-[-0.025em]">
          Styleguide
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[#c9d6db]">
          Tokens y componentes base de Vendora. Cálido, prolijo y confiable —
          todo lo que se construya arriba sale de acá.
        </p>
      </header>

      <Section eyebrow="Tokens" title="Color">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-6">
          {COLOR_TOKENS.map(({ token, className, ring }) => (
            <div key={token} className="flex flex-col gap-2">
              <div
                className={`h-16 rounded-card ${ring ? "border border-line-soft" : ""} ${className}`}
              />
              <code className="text-[11px] text-ink-muted">{token}</code>
            </div>
          ))}
        </div>
      </Section>

      <Section eyebrow="Tokens" title="Tipografía">
        <div className="flex flex-col gap-3">
          <p className="text-4xl font-extrabold tracking-[-0.03em] text-ink-strong">
            Envíos a todo AMBA
          </p>
          <p className="text-2xl font-bold text-ink-strong">
            Productos relacionados
          </p>
          <p className="max-w-xl text-base leading-relaxed text-ink-muted">
            Cuerpo de texto para descripciones y ayudas. Buscamos una lectura
            cómoda y un interlineado generoso en mobile.
          </p>
          <p className="font-mono text-xs uppercase tracking-[0.18em] text-brand-deep">
            Electrónica › Audio
          </p>
        </div>
      </Section>

      <Section eyebrow="Librería" title="Botones">
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="primary">Agregar al carrito</Button>
          <Button variant="secondary">Seguir comprando</Button>
          <Button variant="ghost">Ver detalle</Button>
          <Button variant="danger">Eliminar</Button>
          <Button disabled>Sin stock</Button>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button size="sm">Small</Button>
          <Button size="md">Medium</Button>
          <Button size="lg">Large</Button>
        </div>
      </Section>

      <Section eyebrow="Librería" title="Badges">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone="success">En stock</Badge>
          <Badge tone="warning">Últimas 3 unidades</Badge>
          <Badge tone="danger">Sin stock</Badge>
          <Badge tone="brand">-20% OFF</Badge>
          <Badge tone="info">Envío gratis</Badge>
          <Badge tone="neutral">Neutral</Badge>
          <Pill>SKU AUD-204</Pill>
        </div>
      </Section>

      <Section eyebrow="Librería" title="Campos de formulario">
        <div className="grid gap-5 sm:max-w-2xl sm:grid-cols-2">
          <Field label="Email" hint="Te mandamos el seguimiento acá.">
            <Input placeholder="nombre@correo.com" type="email" />
          </Field>
          <Field label="Provincia">
            <Select defaultValue="CABA">
              <option value="CABA">CABA</option>
              <option value="GBA">Buenos Aires</option>
            </Select>
          </Field>
          <Field label="DNI">
            <Input defaultValue="—" disabled />
          </Field>
          <Field label="Notas">
            <Textarea placeholder="Indicaciones para la entrega…" />
          </Field>
          <Field
            label="CP / Código postal"
            error="Ingresá un CP válido de AMBA."
            required
            className="sm:col-span-2 sm:max-w-xs"
          >
            <Input defaultValue="C100AAB" />
          </Field>
        </div>
      </Section>

      <Section eyebrow="Librería" title="Cards">
        <div className="grid gap-4 sm:grid-cols-3">
          <Card variant="panel">Panel</Card>
          <Card variant="outline">Outline</Card>
          <Card variant="glass">Glass</Card>
        </div>
      </Section>

      <Section eyebrow="Librería" title="Navegación">
        <Breadcrumb
          items={[
            { label: "Inicio", href: "/" },
            { label: "Electrónica", href: "/" },
            { label: "Audio", href: "/" },
            { label: "Auriculares Onda" },
          ]}
        />
        <Pagination page={page} pageCount={12} onPageChange={setPage} />
      </Section>

      <Section eyebrow="Librería" title="Estados">
        <div className="flex items-center gap-4">
          <Spinner />
          <Skeleton className="h-10 w-40" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <EmptyState
            icon="🔍"
            title="Sin resultados"
            description="No encontramos productos para “auriculares rojos”. Probá con menos filtros."
            action={<Button variant="secondary">Limpiar filtros</Button>}
          />
          <EmptyState
            icon="!"
            title="No pudimos cargar"
            description="Hubo un problema al traer los productos. Reintentá en unos segundos."
            action={<Button>Reintentar</Button>}
          />
        </div>
      </Section>

      <Section eyebrow="Librería" title="Dialog">
        <Button onClick={() => setDialogOpen(true)}>Abrir dialog</Button>
        <Dialog
          open={dialogOpen}
          onClose={() => setDialogOpen(false)}
          title="¿Vaciar el carrito?"
          footer={
            <>
              <Button variant="secondary" onClick={() => setDialogOpen(false)}>
                Cancelar
              </Button>
              <Button variant="danger" onClick={() => setDialogOpen(false)}>
                Sí, vaciar
              </Button>
            </>
          }
        >
          Vas a eliminar los 3 productos de tu carrito. Esta acción no se puede
          deshacer.
        </Dialog>
      </Section>
    </main>
  );
}
