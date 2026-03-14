"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { StorefrontHeader } from "@/components/storefront/storefront-header";

export function AppChrome({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isAdminRoute = pathname?.startsWith("/admin") ?? false;

  return (
    <>
      {isAdminRoute ? null : <StorefrontHeader />}
      {children}
    </>
  );
}
