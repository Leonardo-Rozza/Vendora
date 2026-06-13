import Link from "next/link";
import { TrackingTimeline } from "@/components/order-tracking/tracking-timeline";
import { Badge } from "@/components/ui";
import { formatMoney } from "@/lib/commerce/format";
import type { BuyerTrackingStatus, OrderTrackingView } from "@/lib/contracts";

type Tone = "success" | "info";

function statusTone(status: BuyerTrackingStatus): Tone {
  return status === "ENTREGADO" ? "success" : "info";
}

function headline(status: BuyerTrackingStatus, fallback: string): string {
  switch (status) {
    case "ENTREGADO":
      return "¡Tu pedido llegó!";
    case "EN_CAMINO":
      return "Tu pedido está en camino";
    case "LISTO_PARA_ENTREGA":
      return "Tu pedido está listo para la entrega";
    case "PREPARANDO_PEDIDO":
      return "Preparando tu pedido";
    case "PAGO_CONFIRMADO":
      return "Pago confirmado";
    case "PAGO_PENDIENTE":
      return "Esperando la confirmación del pago";
    case "CANCELADO":
      return "Tu pedido fue cancelado";
    default:
      return fallback;
  }
}

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
    currentLabel: string;
    trackingCta: string;
    continueShopping: string;
    shippingTitle: string;
    contactCta: string;
    totalLabel: string;
    sublineCreated: string;
    missingReference: string;
    summaryTitle: string;
    itemCount: string;
  };
}) {
  const createdAt = new Date(tracking.createdAt).toLocaleDateString("es-AR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return (
    <main className="mx-auto w-full max-w-[1040px] px-5 pb-20 pt-7 sm:px-8 lg:px-12">
      {/* Order header */}
      <div className="mb-2 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="font-mono text-xs uppercase tracking-[0.14em] text-brand-deep">
            {copy.orderCode} {tracking.trackingCode ?? copy.missingReference}
          </div>
          <h1 className="mt-1.5 text-[clamp(24px,4vw,32px)] font-extrabold tracking-[-0.02em] text-ink-strong">
            {headline(tracking.status, tracking.statusLabel)}
          </h1>
          <p className="mt-1.5 text-sm text-ink-soft">
            {copy.sublineCreated} {createdAt} · {tracking.statusDescription}
          </p>
        </div>
        <Badge
          tone={statusTone(tracking.status)}
          className="whitespace-nowrap rounded-[9px] px-3.5 py-[7px] text-[13px]"
        >
          {tracking.statusLabel}
        </Badge>
      </div>

      <div className="mt-6 flex flex-wrap items-start gap-7">
        {/* TIMELINE */}
        <div className="min-w-[300px] flex-[2]">
          <TrackingTimeline
            milestones={tracking.timeline}
            status={tracking.status}
            timelineTitle={copy.timelineTitle}
            referenceLabel={copy.deliveryReference}
            currentLabel={copy.currentLabel}
          />
        </div>

        {/* SUMMARY */}
        <div className="flex min-w-[270px] flex-1 flex-col gap-4">
          <div className="rounded-[18px] border border-line-soft bg-surface-panel p-[22px] shadow-soft">
            <h2 className="mb-4 text-base font-extrabold text-ink-strong">
              {copy.summaryTitle}
            </h2>
            <div className="mb-4 flex flex-col gap-3">
              {tracking.items.map((item) => (
                <div
                  key={`${item.productName}-${item.variantName}`}
                  className="flex items-center gap-[11px]"
                >
                  <div
                    className="relative size-11 flex-shrink-0 rounded-[10px]"
                    style={{
                      background:
                        "repeating-linear-gradient(45deg, #f4ede0, #f4ede0 6px, #efe6d6 6px, #efe6d6 12px)",
                    }}
                  >
                    <span className="absolute -right-1.5 -top-1.5 grid size-[19px] place-items-center rounded-full bg-brand-ink text-[10.5px] font-bold text-white">
                      {item.quantity}
                    </span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-[13px] font-semibold leading-[1.25] text-ink-strong">
                      {item.productName}
                    </div>
                    <div className="text-[11.5px] text-ink-soft">
                      {item.variantName}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="mb-3 h-px bg-surface-muted" />
            <div className="flex items-baseline justify-between">
              <span className="text-[15px] font-bold text-ink-strong">
                {copy.totalLabel}
              </span>
              <span className="whitespace-nowrap text-[19px] font-extrabold text-ink-strong">
                {formatMoney(tracking.totalAmount, tracking.currencyCode)}
              </span>
            </div>
          </div>

          <div className="rounded-[18px] border border-line-soft bg-surface-panel p-[22px] shadow-soft">
            <h2 className="mb-3 text-base font-extrabold text-ink-strong">
              {copy.shippingTitle}
            </h2>
            <p className="text-sm leading-[1.6] text-ink-muted">
              {tracking.contactName}
              {tracking.deliveryReference ? (
                <>
                  <br />
                  {tracking.deliveryReference}
                </>
              ) : null}
            </p>
          </div>

          {tracking.trackingUrlPath ? (
            <Link
              href={tracking.trackingUrlPath}
              className="rounded-[12px] border-[1.5px] border-line-strong bg-surface-panel p-[13px] text-center text-[14.5px] font-bold text-brand-deep transition-colors hover:bg-surface-sand"
            >
              {copy.trackingCta}
            </Link>
          ) : null}

          <Link
            href="/"
            className="rounded-[12px] border-[1.5px] border-line-strong bg-surface-panel p-[13px] text-center text-[14.5px] font-bold text-brand-deep transition-colors hover:bg-surface-sand"
          >
            {copy.contactCta}
          </Link>
        </div>
      </div>
    </main>
  );
}
