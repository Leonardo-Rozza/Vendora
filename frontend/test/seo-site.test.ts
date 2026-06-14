import { afterEach, beforeEach, expect, test } from "vitest";
import { absoluteUrl, resolveSiteUrl } from "../lib/seo/site.ts";

const originalSiteUrl = process.env.NEXT_PUBLIC_SITE_URL;

beforeEach(() => {
  delete process.env.NEXT_PUBLIC_SITE_URL;
});

afterEach(() => {
  if (originalSiteUrl === undefined) {
    delete process.env.NEXT_PUBLIC_SITE_URL;
  } else {
    process.env.NEXT_PUBLIC_SITE_URL = originalSiteUrl;
  }
});

test("resolveSiteUrl falls back to the local origin when unset", () => {
  expect(resolveSiteUrl()).toBe("http://localhost:3001");
});

test("resolveSiteUrl trims whitespace and strips a trailing slash", () => {
  process.env.NEXT_PUBLIC_SITE_URL = "  https://vendora.com.ar/  ";
  expect(resolveSiteUrl()).toBe("https://vendora.com.ar");
});

test("absoluteUrl joins paths against the site base, normalizing the slash", () => {
  process.env.NEXT_PUBLIC_SITE_URL = "https://vendora.com.ar";
  expect(absoluteUrl("/products/aurora")).toBe(
    "https://vendora.com.ar/products/aurora",
  );
  expect(absoluteUrl("sitemap.xml")).toBe(
    "https://vendora.com.ar/sitemap.xml",
  );
});
