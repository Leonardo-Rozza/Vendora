"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import {
  ApiError,
  cancelAdminOrder,
  createAdminProduct,
  getCurrentAdmin,
  listAdminOrders,
  listAdminProducts,
  logoutAdmin,
  updateAdminOrderFulfillment,
  updateAdminProduct,
} from "@/lib/commerce/api";
import { ProductEditor } from "@/components/admin/product-editor";
import { OrderList } from "@/components/admin/order-list";
import type {
  AdminOrder,
  AdminProduct,
  AdminProductInput,
  AdminSession,
  FulfillmentStatus,
  UpdateAdminOrderFulfillmentRequest,
} from "@/lib/contracts";

export function AdminDashboard() {
  const router = useRouter();
  const [adminSession, setAdminSession] = useState<AdminSession | null>(null);
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [fulfillmentFilter, setFulfillmentFilter] = useState<FulfillmentStatus | "ALL">("ALL");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadDashboard = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const currentAdmin = await getCurrentAdmin();
      const [nextProducts, nextOrders] = await Promise.all([
        listAdminProducts(),
        listAdminOrders(
          fulfillmentFilter === "ALL"
            ? {}
            : { fulfillmentStatus: fulfillmentFilter },
        ),
      ]);
      setAdminSession(currentAdmin);
      setProducts(nextProducts);
      setOrders(nextOrders);
    } catch (caughtError) {
      const message = caughtError instanceof Error ? caughtError.message : "Admin session could not be loaded.";
      const status = caughtError instanceof ApiError ? caughtError.status : null;
      setError(message);

      if (status === 401 || status === 403) {
        router.replace("/admin/login");
        return;
      }
    } finally {
      setIsLoading(false);
    }
  }, [fulfillmentFilter, router]);

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  async function handleLogout() {
    try {
      await logoutAdmin();
      router.replace("/admin/login");
      router.refresh();
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Admin session could not be closed.",
      );
    }
  }

  async function handleCreateProduct(payload: AdminProductInput) {
    await createAdminProduct(payload);
    await loadDashboard();
  }

  async function handleUpdateProduct(productId: string, payload: AdminProductInput) {
    await updateAdminProduct(productId, payload);
    await loadDashboard();
  }

  async function handleCancelOrder(orderId: string) {
    await cancelAdminOrder(orderId);
    await loadDashboard();
  }

  async function handleAdvanceFulfillment(
    orderId: string,
    payload: UpdateAdminOrderFulfillmentRequest,
  ) {
    await updateAdminOrderFulfillment(orderId, payload);
    await loadDashboard();
  }

  if (isLoading) {
    return (
      <main className="min-h-screen bg-[linear-gradient(180deg,#132531_0%,#172f3d_45%,#f0e7d7_45%,#efe6d7_100%)] px-6 py-8 sm:px-8 lg:px-12">
        <div className="mx-auto grid w-full max-w-7xl gap-5">
          <div className="min-h-48 animate-pulse rounded-[2rem] bg-white/10" />
          <div className="min-h-96 animate-pulse rounded-[2rem] bg-white/70" />
        </div>
      </main>
    );
  }

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
                Operate catalog, inventory, and AMBA-bound purchase requests from one protected boundary.
              </h1>
              <p className="mt-4 text-sm text-white/76">
                Signed in as {adminSession?.email ?? "unknown admin"}. Product mutations and order handling stay server-authorized.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link href="/" className="rounded-full border border-white/18 px-5 py-3 text-sm font-semibold text-white transition-colors duration-200 hover:bg-white/10">
                Return to storefront
              </Link>
              <button className="rounded-full bg-[var(--accent-sand)] px-5 py-3 text-sm font-semibold text-[var(--ink-strong)]" onClick={() => void handleLogout()} type="button">
                Logout
              </button>
            </div>
          </div>
        </header>

        {error ? (
          <div className="rounded-[1.5rem] border border-[var(--warning-line)] bg-[var(--warning-surface)] p-5 text-sm text-[var(--ink-strong)]">
            {error}
          </div>
        ) : null}

        <section className="grid gap-5">
          <ProductEditor products={products} onCreate={handleCreateProduct} onUpdate={handleUpdateProduct} />
          <OrderList
            orders={orders}
            selectedFulfillmentFilter={fulfillmentFilter}
            onAdvanceFulfillment={handleAdvanceFulfillment}
            onCancel={handleCancelOrder}
            onFulfillmentFilterChange={setFulfillmentFilter}
          />
        </section>
      </div>
    </main>
  );
}
