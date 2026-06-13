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
  Select,
  Skeleton,
  Spinner,
  Textarea,
} from "@/components/ui";

// Literal class strings so Tailwind v4 generates the utilities (it scans source
// for literal class names; `bg-${token}` would not be detected).
const COLOR_TOKENS: { token: string; className: string }[] = [
  { token: "surface-base", className: "bg-surface-base" },
  { token: "surface-panel", className: "bg-surface-panel" },
  { token: "ink-strong", className: "bg-ink-strong" },
  { token: "ink-muted", className: "bg-ink-muted" },
  { token: "ink-soft", className: "bg-ink-soft" },
  { token: "brand-deep", className: "bg-brand-deep" },
  { token: "brand-ink", className: "bg-brand-ink" },
  { token: "accent-sand", className: "bg-accent-sand" },
  { token: "accent-sky", className: "bg-accent-sky" },
];

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-4">
      <h2 className="font-mono text-xs uppercase tracking-[0.28em] text-ink-soft">
        {title}
      </h2>
      {children}
    </section>
  );
}

export default function StyleguidePage() {
  const [page, setPage] = useState(3);
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-12 px-6 py-12 sm:px-8">
      <header>
        <p className="font-mono text-xs uppercase tracking-[0.34em] text-ink-soft">
          Vendora · Design system
        </p>
        <h1 className="mt-3 text-4xl font-semibold tracking-[-0.04em] text-ink-strong">
          Styleguide
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-ink-muted">
          Tokens y componentes base. Esta página es el catálogo vivo del sistema
          de diseño; todo lo que se construya arriba debe salir de acá.
        </p>
      </header>

      <Section title="Colores">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
          {COLOR_TOKENS.map(({ token, className }) => (
            <div key={token} className="flex flex-col gap-2">
              <div
                className={`h-16 rounded-card border border-line-soft ${className}`}
              />
              <code className="text-xs text-ink-muted">{token}</code>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Tipografía">
        <div className="flex flex-col gap-2">
          <p className="text-4xl font-semibold tracking-[-0.04em] text-ink-strong">
            Display · 36
          </p>
          <p className="text-2xl font-semibold text-ink-strong">Título · 24</p>
          <p className="text-base text-ink-muted">Cuerpo · 16</p>
          <p className="font-mono text-xs uppercase tracking-[0.28em] text-ink-soft">
            Mono eyebrow · 12
          </p>
        </div>
      </Section>

      <Section title="Botones">
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="primary">Primario</Button>
          <Button variant="secondary">Secundario</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="danger">Peligro</Button>
          <Button disabled>Deshabilitado</Button>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button size="sm">Small</Button>
          <Button size="md">Medium</Button>
          <Button size="lg">Large</Button>
        </div>
      </Section>

      <Section title="Badges">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone="neutral">Neutral</Badge>
          <Badge tone="brand">Brand</Badge>
          <Badge tone="info">Info</Badge>
          <Badge tone="success">En stock</Badge>
          <Badge tone="warning">Últimas unidades</Badge>
        </div>
      </Section>

      <Section title="Formularios">
        <div className="grid gap-4 sm:max-w-md">
          <Field label="Nombre" hint="Como figura en tu documento">
            <Input placeholder="Ada Lovelace" />
          </Field>
          <Field label="Provincia">
            <Select defaultValue="CABA">
              <option value="CABA">CABA</option>
              <option value="GBA">GBA</option>
            </Select>
          </Field>
          <Field label="Notas">
            <Textarea placeholder="Indicaciones para la entrega" />
          </Field>
          <Field
            label="Email"
            error="Ingresá un email válido"
            required
          >
            <Input defaultValue="no-es-un-email" type="email" />
          </Field>
        </div>
      </Section>

      <Section title="Cards">
        <div className="grid gap-4 sm:grid-cols-3">
          <Card variant="panel">Panel</Card>
          <Card variant="outline">Outline</Card>
          <Card variant="glass">Glass</Card>
        </div>
      </Section>

      <Section title="Navegación">
        <Breadcrumb
          items={[
            { label: "Inicio", href: "/" },
            { label: "Electrónica", href: "/" },
            { label: "Auriculares" },
          ]}
        />
        <Pagination page={page} pageCount={12} onPageChange={setPage} />
      </Section>

      <Section title="Estados">
        <div className="flex items-center gap-4">
          <Spinner />
          <Skeleton className="h-10 w-40" />
        </div>
        <EmptyState
          title="Sin resultados"
          description="No encontramos productos para esos filtros. Probá ampliar la búsqueda."
          action={<Button variant="secondary">Limpiar filtros</Button>}
        />
      </Section>

      <Section title="Dialog">
        <Button onClick={() => setDialogOpen(true)}>Abrir dialog</Button>
        <Dialog
          open={dialogOpen}
          onClose={() => setDialogOpen(false)}
          title="¿Eliminar producto?"
          footer={
            <>
              <Button variant="ghost" onClick={() => setDialogOpen(false)}>
                Cancelar
              </Button>
              <Button variant="danger" onClick={() => setDialogOpen(false)}>
                Eliminar
              </Button>
            </>
          }
        >
          Esta acción no se puede deshacer.
        </Dialog>
      </Section>
    </main>
  );
}
