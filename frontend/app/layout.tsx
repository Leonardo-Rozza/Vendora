import type { Metadata } from "next";
import { CommerceProvider } from "@/components/commerce/commerce-provider";
import { StorefrontHeader } from "@/components/storefront/storefront-header";
import "./globals.css";

export const metadata: Metadata = {
  title: "Vendora",
  description: "Customer storefront and admin foundations for the Vendora MVP.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es-AR">
      <body className="bg-[var(--surface-base)] text-[var(--ink-strong)] antialiased">
        <CommerceProvider>
          <StorefrontHeader />
          {children}
        </CommerceProvider>
      </body>
    </html>
  );
}
