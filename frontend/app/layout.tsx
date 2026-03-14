import type { Metadata } from "next";
import { CommerceProvider } from "@/components/commerce/commerce-provider";
import { AppChrome } from "@/components/layout/app-chrome";
import { appCopy } from "@/lib/copy/es-ar";
import "./globals.css";

export const metadata: Metadata = {
  title: appCopy.metadata.title,
  description: appCopy.metadata.description,
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
          <AppChrome>{children}</AppChrome>
        </CommerceProvider>
      </body>
    </html>
  );
}
