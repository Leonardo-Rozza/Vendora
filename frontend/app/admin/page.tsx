import Link from "next/link";
import { adminWorkspaces } from "@/lib/shell-data";

export default function AdminPage() {
  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#132531_0%,#172f3d_45%,#f0e7d7_45%,#efe6d7_100%)] px-6 py-8 sm:px-8 lg:px-12">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        <header className="rounded-[2rem] border border-white/10 bg-white/8 p-6 text-white shadow-[0_20px_80px_rgba(8,14,19,0.28)] backdrop-blur">
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.34em] text-[var(--accent-sand)]">
                Privileged admin shell
              </p>
              <h1 className="mt-3 max-w-3xl text-4xl font-semibold tracking-[-0.05em] sm:text-5xl">
                A distinct operations boundary for catalog, media, inventory, and order work.
              </h1>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                href="/"
                className="rounded-full border border-white/18 px-5 py-3 text-sm font-semibold text-white transition-colors duration-200 hover:bg-white/10"
              >
                Return to storefront
              </Link>
              <span className="rounded-full bg-[var(--accent-sand)] px-5 py-3 text-sm font-semibold text-[var(--ink-strong)]">
                Auth reserved for later
              </span>
            </div>
          </div>
        </header>

        <section className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
          <aside className="rounded-[2rem] border border-[var(--line-soft)] bg-[var(--surface-panel)] p-6 shadow-[0_18px_60px_rgba(51,38,29,0.1)]">
            <p className="font-mono text-xs uppercase tracking-[0.32em] text-[var(--ink-soft)]">
              Boundary notes
            </p>
            <div className="mt-6 space-y-4">
              {[
                "Storefront and admin surfaces evolve independently.",
                "Business logic remains in backend services, not admin widgets.",
                "Media references stay external and connect through signed upload contracts.",
                "Paid orders remain immutable regardless of future editing tools.",
              ].map((note) => (
                <div
                  key={note}
                  className="rounded-[1.4rem] border border-[var(--line-soft)] bg-white/70 px-4 py-4 text-sm leading-7 text-[var(--ink-muted)]"
                >
                  {note}
                </div>
              ))}
            </div>
          </aside>

          <div className="grid gap-5 sm:grid-cols-2">
            {adminWorkspaces.map((workspace) => (
              <article
                key={workspace.title}
                className="rounded-[2rem] border border-[var(--line-soft)] bg-[var(--surface-panel)] p-6 shadow-[0_18px_60px_rgba(51,38,29,0.1)]"
              >
                <div className="flex items-center justify-between gap-4">
                  <h2 className="text-2xl font-semibold tracking-[-0.04em] text-[var(--ink-strong)]">
                    {workspace.title}
                  </h2>
                  <span className="rounded-full bg-[var(--surface-base)] px-3 py-1 font-mono text-xs uppercase tracking-[0.24em] text-[var(--brand-deep)]">
                    {workspace.status}
                  </span>
                </div>
                <p className="mt-4 text-sm leading-7 text-[var(--ink-muted)]">
                  {workspace.description}
                </p>
              </article>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
