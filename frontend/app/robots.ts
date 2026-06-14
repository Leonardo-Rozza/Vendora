import type { MetadataRoute } from "next";
import { absoluteUrl, resolveSiteUrl } from "@/lib/seo/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Private/transactional areas: no SEO value and should never be indexed.
      disallow: ["/admin", "/checkout/", "/seguimiento/"],
    },
    sitemap: absoluteUrl("/sitemap.xml"),
    host: resolveSiteUrl(),
  };
}
