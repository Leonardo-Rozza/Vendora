import Link from "next/link";
import { TrackingTimeline } from "@/components/order-tracking/tracking-timeline";
import { formatMoney } from "@/lib/commerce/format";
import type { OrderTrackingView } from "@/lib/contracts";

export function OrderTrackingPage({
  tracking,
  copy,
}: {
  tracking: OrderTrackingView;
  copy: {
    eyebrow: string;
    title: string;
    description: string;
    statusLabel: string;
    deliveryReference: string;
    orderCode: string;
    orderDate: string;
    paidAt: string;
    itemsTitle: string;
    timelineTitle: string;
    trackingCta: string;
    continueShopping: string;
    missingReference: string;
    summaryTitle: string;
    itemCount: string;
  };
}) {
  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#f4ecdf_0%,#f1e8da_40%,#dfe7e5_100%)] px-6 py-10 sm:px-8 lg:px-12">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <section className="overflow-hidden rounded-[2.2rem] border border-[var(--line-soft)] bg-[linear-gradient(135deg,rgba(18,39,52,0.98),rgba(25,72,88,0.94))] p-7 text-white shadow-[0_24px_90px_rgba(8,14,19,0.24)]">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <p className="font-mono text-xs uppercase tracking-[0.34em] text-[var(--accent-sand)]">
                {copy.eyebrow}
              </p>
              <h1 className="mt-4 text-4xl font-semibold tracking-[-0.05em] sm:text-5xl">
                {copy.title}
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-white/76">
                {copy.description}
              </p>
            </div>
            <div className="rounded-[1.6rem] border border-white/10 bg-white/8 p-5 backdrop-blur">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/58">
                {copy.statusLabel}
              </p>
              <p className="mt-3 text-2xl font-semibold">
                {tracking.statusLabel}
              </p>
              <p className="mt-3 max-w-sm text-sm leading-7 text-white/72">
                {tracking.statusDescription}
              </p>
            </div>
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
          <aside className="space-y-6">
            <article className="rounded-[1.8rem] border border-[var(--line-soft)] bg-white/82 p-6 shadow-[0_18px_50px_rgba(61,43,28,0.08)]">
              <p className="font-mono text-xs uppercase tracking-[0.28em] text-[var(--ink-soft)]">
                {copy.summaryTitle}
              </p>
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <div className="rounded-[1.3rem] border border-[var(--line-soft)] bg-[var(--surface-panel)] p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-[var(--ink-soft)]">
                    {copy.orderCode}
                  </p>
                  <p className="mt-2 text-lg font-semibold text-[var(--ink-strong)]">
                    {tracking.trackingCode ?? copy.missingReference}
                  </p>
                </div>
                <div className="rounded-[1.3rem] border border-[var(--line-soft)] bg-[var(--surface-panel)] p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-[var(--ink-soft)]">
                    {copy.itemCount}
                  </p>
                  <p className="mt-2 text-lg font-semibold text-[var(--ink-strong)]">
                    {tracking.itemCount}
                  </p>
                </div>
                <div className="rounded-[1.3rem] border border-[var(--line-soft)] bg-[var(--surface-panel)] p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-[var(--ink-soft)]">
                    {copy.orderDate}
                  </p>
                  <p className="mt-2 text-sm font-semibold text-[var(--ink-strong)]">
                    {new Date(tracking.createdAt).toLocaleString("es-AR")}
                  </p>
                </div>
                <div className="rounded-[1.3rem] border border-[var(--line-soft)] bg-[var(--surface-panel)] p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-[var(--ink-soft)]">
                    {copy.paidAt}
                  </p>
                  <p className="mt-2 text-sm font-semibold text-[var(--ink-strong)]">
                    {tracking.paidAt
                      ? new Date(tracking.paidAt).toLocaleString("es-AR")
                      : copy.missingReference}
                  </p>
                </div>
              </div>

              <div className="mt-5 rounded-[1.4rem] border border-[var(--line-soft)] bg-[linear-gradient(160deg,rgba(210,120,55,0.12),rgba(24,80,104,0.08))] p-5">
                <p className="text-sm text-[var(--ink-muted)]">
                  {tracking.contactName}
                </p>
                <p className="mt-2 text-2xl font-semibold text-[var(--ink-strong)]">
                  {formatMoney(tracking.totalAmount, tracking.currencyCode)}
                </p>
                {tracking.deliveryReference ? (
                  <p className="mt-3 text-sm leading-7 text-[var(--ink-muted)]">
                    {copy.deliveryReference}: {tracking.deliveryReference}
                  </p>
                ) : null}
              </div>

              <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                {tracking.trackingUrlPath ? (
                  <Link
                    className="rounded-full bg-[var(--ink-strong)] px-5 py-3 text-sm font-semibold text-[var(--surface-base)]"
                    href={tracking.trackingUrlPath}
                  >
                    {copy.trackingCta}
                  </Link>
                ) : null}
                <Link
                  className="rounded-full border border-[var(--line-strong)] px-5 py-3 text-sm font-semibold text-[var(--ink-strong)]"
                  href="/"
                >
                  {copy.continueShopping}
                </Link>
              </div>
            </article>

            <article className="rounded-[1.8rem] border border-[var(--line-soft)] bg-white/82 p-6 shadow-[0_18px_50px_rgba(61,43,28,0.08)]">
              <h2 className="text-xl font-semibold tracking-[-0.03em] text-[var(--ink-strong)]">
                {copy.itemsTitle}
              </h2>
              <div className="mt-4 space-y-3">
                {tracking.items.map((item) => (
                  <div
                    key={`${item.productName}-${item.variantName}`}
                    className="rounded-[1.3rem] border border-[var(--line-soft)] bg-[var(--surface-panel)] px-4 py-4"
                  >
                    <p className="font-semibold text-[var(--ink-strong)]">
                      {item.productName}
                    </p>
                    <p className="mt-1 text-sm text-[var(--ink-muted)]">
                      {item.variantName} · {item.quantity} u.
                    </p>
                  </div>
                ))}
              </div>
            </article>
          </aside>

          <TrackingTimeline
            milestones={tracking.timeline}
            timelineTitle={copy.timelineTitle}
            referenceLabel={copy.deliveryReference}
          />
        </section>
      </div>
    </main>
  );
}
