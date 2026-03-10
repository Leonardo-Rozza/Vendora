import Link from "next/link";
import { featuredProducts, storefrontHighlights } from "@/lib/shell-data";

export default function Home() {
  return (
    <main className="min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(210,120,55,0.18),_transparent_28%),radial-gradient(circle_at_top_right,_rgba(24,80,104,0.14),_transparent_30%),linear-gradient(180deg,_#f5efe4_0%,_#f2ece1_46%,_#ebe2d3_100%)]">
      <section className="mx-auto flex w-full max-w-7xl flex-col gap-10 px-6 py-8 sm:px-8 lg:px-12">
        <header className="flex flex-col gap-6 rounded-[2rem] border border-white/55 bg-white/78 p-6 shadow-[0_24px_90px_rgba(82,56,34,0.12)] backdrop-blur md:flex-row md:items-center md:justify-between">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.34em] text-[var(--ink-soft)]">
              Vendora storefront foundation
            </p>
            <h1 className="mt-3 max-w-2xl text-4xl font-semibold tracking-[-0.05em] text-[var(--ink-strong)] sm:text-5xl">
              A customer shell ready for catalog, cart, and checkout growth.
            </h1>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              href="#featured-products"
              className="rounded-full bg-[var(--ink-strong)] px-5 py-3 text-sm font-semibold text-[var(--surface-base)] transition-transform duration-200 hover:-translate-y-0.5"
            >
              Explore shell
            </Link>
            <Link
              href="/admin"
              className="rounded-full border border-[var(--line-strong)] px-5 py-3 text-sm font-semibold text-[var(--ink-strong)] transition-colors duration-200 hover:bg-white/70"
            >
              Open admin boundary
            </Link>
          </div>
        </header>

        <section className="grid gap-5 lg:grid-cols-[1.35fr_0.8fr]">
          <article className="rounded-[2rem] border border-[var(--line-soft)] bg-[var(--surface-panel)] p-8 shadow-[0_20px_70px_rgba(61,43,28,0.08)]">
            <div className="flex flex-wrap gap-3">
              <span className="rounded-full border border-[var(--line-soft)] bg-white/70 px-3 py-1 font-mono text-xs uppercase tracking-[0.28em] text-[var(--ink-soft)]">
                Catalog-ready
              </span>
              <span className="rounded-full border border-[var(--line-soft)] bg-white/70 px-3 py-1 font-mono text-xs uppercase tracking-[0.28em] text-[var(--ink-soft)]">
                Variant-aware
              </span>
              <span className="rounded-full border border-[var(--line-soft)] bg-white/70 px-3 py-1 font-mono text-xs uppercase tracking-[0.28em] text-[var(--ink-soft)]">
                API seam first
              </span>
            </div>
            <p className="mt-8 max-w-2xl text-lg leading-8 text-[var(--ink-muted)]">
              The storefront stays intentionally light on behavior while exposing the places where product discovery, cart state, and Mercado Pago checkout will attach next.
            </p>
            <div id="catalog" className="mt-10 grid gap-4 md:grid-cols-3">
              {storefrontHighlights.map((highlight) => (
                <a
                  key={highlight.title}
                  href={highlight.href}
                  className="rounded-[1.5rem] border border-[var(--line-soft)] bg-white/82 p-5 transition-transform duration-200 hover:-translate-y-1"
                >
                  <p className="font-mono text-xs uppercase tracking-[0.28em] text-[var(--brand-deep)]">
                    Foundation seam
                  </p>
                  <h2 className="mt-4 text-xl font-semibold text-[var(--ink-strong)]">
                    {highlight.title}
                  </h2>
                  <p className="mt-3 text-sm leading-7 text-[var(--ink-muted)]">
                    {highlight.description}
                  </p>
                </a>
              ))}
            </div>
          </article>

          <aside className="rounded-[2rem] border border-[var(--line-soft)] bg-[linear-gradient(180deg,rgba(26,58,73,0.96),rgba(18,39,52,0.98))] p-8 text-[var(--surface-base)] shadow-[0_20px_70px_rgba(23,35,41,0.28)]">
            <p className="font-mono text-xs uppercase tracking-[0.32em] text-[var(--accent-sand)]">
              Checkout entry
            </p>
            <h2 id="checkout-entry" className="mt-4 text-3xl font-semibold tracking-[-0.04em]">
              Mercado Pago attaches here when the order flow is ready.
            </h2>
            <p className="mt-5 text-sm leading-7 text-white/74">
              This shell keeps the payment handoff visible without implying completed cart persistence, redirect handling, or confirmation UX in the foundation batch.
            </p>
            <div className="mt-8 rounded-[1.6rem] border border-white/12 bg-white/6 p-5">
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <span className="font-mono text-xs uppercase tracking-[0.28em] text-white/58">
                  Future API contract
                </span>
                <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-white/80">
                  Pending phase 5+
                </span>
              </div>
              <dl className="mt-4 space-y-4 text-sm text-white/74">
                <div className="flex items-center justify-between gap-4">
                  <dt>Order snapshot</dt>
                  <dd>Server-owned</dd>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <dt>Preference creation</dt>
                  <dd>Payments API seam</dd>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <dt>Confirmation source</dt>
                  <dd>Webhook authority</dd>
                </div>
              </dl>
            </div>
          </aside>
        </section>

        <section id="featured-products" className="grid gap-5 lg:grid-cols-[1.1fr_1fr]">
          <div className="rounded-[2rem] border border-[var(--line-soft)] bg-white/78 p-6 shadow-[0_14px_60px_rgba(74,54,39,0.08)]">
            <p className="font-mono text-xs uppercase tracking-[0.3em] text-[var(--ink-soft)]">
              Featured products placeholder
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-[var(--ink-strong)]">
              Product cards already speak the backend catalog contract.
            </h2>
            <div className="mt-8 grid gap-4">
              {featuredProducts.map((product) => (
                <article
                  key={product.id}
                  className="rounded-[1.75rem] border border-[var(--line-soft)] bg-[var(--surface-panel)] p-5"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-mono text-xs uppercase tracking-[0.28em] text-[var(--brand-deep)]">
                        {product.status}
                      </p>
                      <h3 className="mt-3 text-2xl font-semibold text-[var(--ink-strong)]">
                        {product.name}
                      </h3>
                    </div>
                    <div className="rounded-full border border-[var(--line-soft)] px-3 py-1 font-mono text-xs uppercase tracking-[0.24em] text-[var(--ink-soft)]">
                      {product.variants.length} variants
                    </div>
                  </div>
                  <p className="mt-4 max-w-xl text-sm leading-7 text-[var(--ink-muted)]">
                    {product.description}
                  </p>
                  <div className="mt-5 flex flex-wrap gap-3">
                    {product.variants.map((variant) => (
                      <div
                        key={variant.id}
                        className="rounded-full bg-[var(--surface-base)] px-4 py-2 text-sm text-[var(--ink-strong)]"
                      >
                        {variant.name} - {new Intl.NumberFormat("es-AR", {
                          style: "currency",
                          currency: variant.currencyCode,
                          maximumFractionDigits: 0,
                        }).format(Number(variant.priceAmount))}
                      </div>
                    ))}
                  </div>
                </article>
              ))}
            </div>
          </div>

          <div className="grid gap-5">
            <article className="rounded-[2rem] border border-[var(--line-soft)] bg-[var(--surface-panel)] p-6 shadow-[0_14px_60px_rgba(74,54,39,0.08)]">
              <p className="font-mono text-xs uppercase tracking-[0.3em] text-[var(--ink-soft)]">
                Browse destinations
              </p>
              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                {[
                  "Audio and home tech",
                  "Desk upgrades",
                  "Kitchen gadgets",
                  "New arrivals",
                ].map((category) => (
                  <div
                    key={category}
                    className="rounded-[1.4rem] border border-[var(--line-soft)] bg-white/70 px-4 py-5 text-sm font-medium text-[var(--ink-strong)]"
                  >
                    {category}
                  </div>
                ))}
              </div>
            </article>
            <article className="rounded-[2rem] border border-[var(--line-soft)] bg-white/82 p-6 shadow-[0_14px_60px_rgba(74,54,39,0.08)]">
              <p className="font-mono text-xs uppercase tracking-[0.3em] text-[var(--ink-soft)]">
                Cart placeholder
              </p>
              <h2 className="mt-3 text-2xl font-semibold tracking-[-0.04em] text-[var(--ink-strong)]">
                Ready for persistent cart state in a later batch.
              </h2>
              <p className="mt-4 text-sm leading-7 text-[var(--ink-muted)]">
                The shell advertises a cart destination and order summary region without claiming stored sessions, quantity editing, or checkout completion yet.
              </p>
            </article>
          </div>
        </section>
      </section>
    </main>
  );
}
