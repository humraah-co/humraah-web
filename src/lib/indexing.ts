// Standalone on purpose: next.config.ts imports this file, so it can't use
// the "@/" alias and imports nothing.

/**
 * Only the live site (VERCEL_ENV=production) may appear in search results.
 * Preview deployments, and anything not running on Vercel, are kept out:
 * robots.txt disallows everything and every response says noindex.
 */
export function isProductionDeployment(vercelEnv: string | undefined = process.env.VERCEL_ENV) {
  return vercelEnv === "production";
}

/** The site's address with no trailing slash (NEXT_PUBLIC_SITE_URL). */
export function siteUrl(value: string | undefined = process.env.NEXT_PUBLIC_SITE_URL) {
  return (value || "http://localhost:3000").replace(/\/+$/, "");
}

/** The header that keeps a non-production deployment out of search, or nothing on the live site. */
export function noindexHeaders(vercelEnv: string | undefined = process.env.VERCEL_ENV) {
  return isProductionDeployment(vercelEnv) ? [] : [{ key: "X-Robots-Tag", value: "noindex, nofollow" }];
}

export type RobotsRules = {
  rules: { userAgent: string; allow?: string; disallow: string | string[] };
  sitemap?: string;
};

/** What robots.txt says: everything is off limits except on the live site, where only /admin is. */
export function robotsFor(vercelEnv: string | undefined, site: string): RobotsRules {
  if (!isProductionDeployment(vercelEnv)) return { rules: { userAgent: "*", disallow: "/" } };
  return { rules: { userAgent: "*", allow: "/", disallow: "/admin" }, sitemap: `${site}/sitemap.xml` };
}
