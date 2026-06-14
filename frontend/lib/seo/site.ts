/**
 * Resolves the public base URL of the storefront from the environment.
 *
 * Configured via `NEXT_PUBLIC_SITE_URL`; falls back to the local dev origin so
 * metadata, robots and sitemap keep working without extra setup.
 */
export function resolveSiteUrl(): string {
  const configuredSiteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();

  if (configuredSiteUrl) {
    return configuredSiteUrl.replace(/\/$/, "");
  }

  return "http://localhost:3001";
}

/** Builds an absolute URL for a path against the public site base. */
export function absoluteUrl(path = "/"): string {
  const siteUrl = resolveSiteUrl();
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;

  return `${siteUrl}${normalizedPath}`;
}
