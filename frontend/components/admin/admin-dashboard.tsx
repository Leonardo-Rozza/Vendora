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
import { cn } from "@/components/ui";
import { appCopy } from "@/lib/copy/es-ar";
import type {
  AdminOrder,
  AdminProduct,
  AdminProductInput,
  AdminSession,
  FulfillmentStatus,
  UpdateAdminOrderFulfillmentRequest,
} from "@/lib/contracts";

type AdminTab = "products" | "orders";

export function AdminDashboard() {
  const copy = appCopy.adminDashboard;
  const router = useRouter();
  const [adminSession, setAdminSession] = useState<AdminSession | null>(null);
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [fulfillmentFilter, setFulfillmentFilter] = useState<FulfillmentStatus | "ALL">("ALL");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<AdminTab>("products");

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
      const message = caughtError instanceof Error ? caughtError.message : "No pudimos cargar la sesion administrativa.";
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
            : "No pudimos cerrar la sesion administrativa.",
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

  const navItemClass = (active: boolean) =>
    cn(
      "rounded-[9px] px-4 py-2 text-sm font-bold transition-colors outline-none focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-accent-sand",
      active
        ? "bg-[rgba(216,182,144,0.18)] text-[#fbefd9]"
        : "text-accent-sky hover:bg-[rgba(216,182,144,0.1)]",
    );

  return (
    <div className="min-h-screen bg-surface-base">
      <header className="sticky top-0 z-40 bg-brand-ink">
        <div className="mx-auto flex w-full max-w-[1200px] items-center gap-4 px-5 py-3 sm:gap-[18px]">
          <div className="flex items-center gap-2.5">
            <span className="grid size-[34px] place-items-center rounded-[9px] bg-brand-deep text-lg font-extrabold text-surface-base">
              V
            </span>
            <span className="text-base font-extrabold text-[#fbefd9]">Vendora</span>
            <span className="border-l border-[rgba(159,182,190,0.3)] pl-2.5 font-mono text-[10px] uppercase tracking-[0.1em] text-accent-sky">
              {copy.adminTag}
            </span>
          </div>
          <nav className="ml-2 flex gap-1.5">
            <button
              className={navItemClass(activeTab === "products")}
              onClick={() => setActiveTab("products")}
              type="button"
            >
              {copy.navProducts}
            </button>
            <button
              className={navItemClass(activeTab === "orders")}
              onClick={() => setActiveTab("orders")}
              type="button"
            >
              {copy.navOrders}
            </button>
          </nav>
          <div className="flex-1" />
          <div className="flex items-center gap-2.5">
            <Link
              className="hidden text-sm text-[#c9d6db] transition-colors hover:text-[#fbefd9] sm:inline"
              href="/"
            >
              {copy.backToStore}
            </Link>
            <span className="hidden text-sm text-[#c9d6db] sm:inline">
              {adminSession?.email ?? "admin"}
            </span>
            <button
              aria-label={copy.logout}
              className="grid size-[34px] place-items-center rounded-[9px] bg-[rgba(216,182,144,0.16)] text-[15px] text-accent-sand transition-colors hover:bg-[rgba(216,182,144,0.28)] outline-none focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-accent-sand"
              onClick={() => void handleLogout()}
              type="button"
            >
              ⏻
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto w-full max-w-[1200px] px-5 pt-7 pb-20">
        {error ? (
          <div
            className="mb-5 rounded-card border border-warning-line bg-warning-surface px-5 py-4 text-sm text-ink-strong"
            role="alert"
          >
            {error}
          </div>
        ) : null}

        {isLoading ? (
          <div className="grid gap-4">
            <div className="h-12 w-72 animate-pulse rounded-card bg-surface-muted" />
            <div className="h-96 animate-pulse rounded-card bg-surface-muted" />
          </div>
        ) : activeTab === "products" ? (
          <ProductEditor
            products={products}
            onCreate={handleCreateProduct}
            onUpdate={handleUpdateProduct}
          />
        ) : (
          <OrderList
            orders={orders}
            selectedFulfillmentFilter={fulfillmentFilter}
            onAdvanceFulfillment={handleAdvanceFulfillment}
            onCancel={handleCancelOrder}
            onFulfillmentFilterChange={setFulfillmentFilter}
          />
        )}
      </div>
    </div>
  );
}
