"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { StorefrontFooter } from "@/components/storefront/storefront-footer";
import { StorefrontHeader } from "@/components/storefront/storefront-header";

export function AppChrome({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isAdminRoute = pathname?.startsWith("/admin") ?? false;

  if (isAdminRoute) {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-screen flex-col">
      <StorefrontHeader />
      <div className="flex-1">{children}</div>
      <StorefrontFooter />
    </div>
  );
}
