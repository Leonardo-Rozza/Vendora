import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Vendora",
  description: "Storefront and admin foundations for the Vendora MVP.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es-AR">
      <body className="bg-[var(--surface-base)] text-[var(--ink-strong)] antialiased">{children}</body>
    </html>
  );
}
