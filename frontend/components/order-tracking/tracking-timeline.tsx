import type { OrderTrackingMilestone } from "@/lib/contracts";

export function TrackingTimeline({
  milestones,
  timelineTitle,
  referenceLabel,
}: {
  milestones: OrderTrackingMilestone[];
  timelineTitle: string;
  referenceLabel: string;
}) {
  return (
    <section className="rounded-[1.8rem] border border-[var(--line-soft)] bg-white/78 p-6 shadow-[0_18px_50px_rgba(61,43,28,0.08)]">
      <div className="flex items-center justify-between gap-4 border-b border-[var(--line-soft)] pb-4">
        <h2 className="text-xl font-semibold tracking-[-0.03em] text-[var(--ink-strong)]">
          {timelineTitle}
        </h2>
        <span className="rounded-full border border-[var(--line-soft)] bg-[var(--surface-panel)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--brand-deep)]">
          {milestones.length}
        </span>
      </div>

      <div className="mt-5 space-y-4">
        {milestones.map((milestone, index) => (
          <article
            key={milestone.id}
            className="relative rounded-[1.4rem] border border-[var(--line-soft)] bg-[var(--surface-panel)] p-4"
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex gap-3">
                <div className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--brand-deep)] text-xs font-semibold text-white">
                  {String(index + 1).padStart(2, "0")}
                </div>
                <div>
                  <h3 className="text-base font-semibold text-[var(--ink-strong)]">
                    {milestone.title}
                  </h3>
                  <p className="mt-2 text-sm leading-7 text-[var(--ink-muted)]">
                    {milestone.description}
                  </p>
                  {milestone.deliveryReference ? (
                    <p className="mt-3 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--brand-deep)]">
                      {referenceLabel}: {milestone.deliveryReference}
                    </p>
                  ) : null}
                </div>
              </div>
              <p className="text-xs uppercase tracking-[0.18em] text-[var(--ink-soft)]">
                {new Date(milestone.occurredAt).toLocaleString("es-AR")}
              </p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
