import { OrderTrackingPage } from "@/components/order-tracking/order-tracking-page";
import { ApiError, getOrderTracking } from "@/lib/commerce/api";
import type { OrderTrackingView } from "@/lib/contracts";
import { appCopy } from "@/lib/copy/es-ar";

export default async function TrackingPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  // Keep JSX out of the try/catch: only the fetch is guarded. A missing token
  // (404) renders the not-found panel; other failures bubble up.
  let tracking: OrderTrackingView | null = null;
  try {
    tracking = await getOrderTracking(token);
  } catch (error) {
    if (!(error instanceof ApiError) || error.status !== 404) {
      throw error;
    }
  }

  if (!tracking) {
    return (
      <main className="mx-auto w-full max-w-4xl px-6 py-12 sm:px-8 lg:px-12">
        <section className="rounded-[2rem] border border-[var(--line-soft)] bg-white/82 p-8 shadow-[0_20px_70px_rgba(61,43,28,0.08)]">
          <p className="font-mono text-xs uppercase tracking-[0.34em] text-[var(--ink-soft)]">
            {appCopy.orderTracking.missingEyebrow}
          </p>
          <h1 className="mt-4 text-4xl font-semibold tracking-[-0.05em] text-[var(--ink-strong)]">
            {appCopy.orderTracking.missingTitle}
          </h1>
          <p className="mt-4 text-sm leading-7 text-[var(--ink-muted)]">
            {appCopy.orderTracking.missingDescription}
          </p>
        </section>
      </main>
    );
  }

  return (
    <OrderTrackingPage tracking={tracking} copy={appCopy.orderTracking} />
  );
}
