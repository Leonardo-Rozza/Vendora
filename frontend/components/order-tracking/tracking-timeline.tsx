import type {
  BuyerTrackingStatus,
  OrderTrackingMilestone,
} from "@/lib/contracts";

type StepState = "done" | "current" | "pending";

function resolveStates(
  count: number,
  status: BuyerTrackingStatus,
): StepState[] {
  // Milestones are historical events that already occurred. The newest (last)
  // one reflects the current state, unless the order reached a terminal status
  // in which case every recorded milestone is considered completed.
  const isTerminal = status === "ENTREGADO" || status === "CANCELADO";
  return Array.from({ length: count }, (_, index) => {
    const isLast = index === count - 1;
    if (isTerminal) {
      return "done";
    }
    return isLast ? "current" : "done";
  });
}

const DOT_BY_STATE: Record<StepState, string> = {
  done: "bg-success-ink text-white text-[15px]",
  current:
    "bg-brand-deep text-white text-[10px] animate-vd-pulse",
  pending:
    "bg-surface-panel text-ink-faint text-[15px] shadow-[inset_0_0_0_2px_var(--line-strong)]",
};

export function TrackingTimeline({
  milestones,
  status,
  timelineTitle,
  referenceLabel,
  currentLabel,
}: {
  milestones: OrderTrackingMilestone[];
  status: BuyerTrackingStatus;
  timelineTitle: string;
  referenceLabel: string;
  currentLabel: string;
}) {
  const states = resolveStates(milestones.length, status);

  return (
    <section className="rounded-[18px] border border-line-soft bg-surface-panel p-7 shadow-soft">
      <h2 className="mb-6 text-[17px] font-extrabold text-ink-strong">
        {timelineTitle}
      </h2>

      <div className="flex flex-col">
        {milestones.map((milestone, index) => {
          const state = states[index];
          const isLast = index === milestones.length - 1;
          const isCurrent = state === "current";
          const isPending = state === "pending";

          return (
            <div key={milestone.id} className="flex gap-4">
              <div className="flex flex-col items-center">
                <div
                  className={`grid size-[34px] shrink-0 place-items-center rounded-full font-extrabold ${DOT_BY_STATE[state]}`}
                  aria-hidden
                >
                  {state === "done" ? "✓" : state === "current" ? "●" : ""}
                </div>
                {!isLast ? (
                  <div
                    className={`my-1 min-h-[34px] w-0.5 flex-1 ${
                      state === "done" ? "bg-success-ink" : "bg-line-soft"
                    }`}
                  />
                ) : null}
              </div>

              <div className={`flex-1 ${isLast ? "pb-0" : "pb-7"}`}>
                <div className="flex flex-wrap items-center gap-x-[9px] gap-y-1">
                  <span
                    className={`text-[15.5px] font-bold ${
                      isPending ? "text-ink-faint" : "text-ink-strong"
                    }`}
                  >
                    {milestone.title}
                  </span>
                  {isCurrent ? (
                    <span className="rounded-[6px] bg-surface-sand px-[9px] py-0.5 text-[11px] font-bold text-brand-deep">
                      {currentLabel}
                    </span>
                  ) : null}
                </div>

                <div className="mt-[3px] text-[13.5px] leading-[1.5] text-ink-soft">
                  {milestone.description}
                </div>

                <div className="mt-[5px] font-mono text-[11.5px] text-ink-faint">
                  {new Date(milestone.occurredAt).toLocaleString("es-AR")}
                </div>

                {milestone.deliveryReference ? (
                  <div className="mt-[11px] flex items-center gap-[10px] rounded-[11px] bg-surface-sand px-[13px] py-[11px]">
                    <span className="text-[17px]" aria-hidden>
                      📦
                    </span>
                    <div>
                      <div className="text-[13px] font-bold text-ink-strong">
                        {referenceLabel}
                      </div>
                      <div className="font-mono text-[11.5px] text-ink-muted">
                        {milestone.deliveryReference}
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
