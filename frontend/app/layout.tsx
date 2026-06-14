import type { Metadata } from "next";
import { Hanken_Grotesk, Space_Mono } from "next/font/google";
import { CommerceProvider } from "@/components/commerce/commerce-provider";
import { AppChrome } from "@/components/layout/app-chrome";
import { appCopy } from "@/lib/copy/es-ar";
import { resolveSiteUrl } from "@/lib/seo/site";
import "./globals.css";

const hankenGrotesk = Hanken_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-hanken",
  display: "swap",
});

const spaceMono = Space_Mono({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-space-mono",
  display: "swap",
});

const siteUrl = resolveSiteUrl();

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: appCopy.metadata.title,
  description: appCopy.metadata.description,
  openGraph: {
    type: "website",
    siteName: appCopy.metadata.title,
    title: appCopy.metadata.title,
    description: appCopy.metadata.description,
    url: siteUrl,
    locale: "es_AR",
  },
  twitter: {
    card: "summary_large_image",
    title: appCopy.metadata.title,
    description: appCopy.metadata.description,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es-AR"
      className={`${hankenGrotesk.variable} ${spaceMono.variable}`}
    >
      <body className="bg-surface-base text-ink-strong antialiased">
        <CommerceProvider>
          <AppChrome>{children}</AppChrome>
        </CommerceProvider>
      </body>
    </html>
  );
}
