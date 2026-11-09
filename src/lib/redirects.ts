/**
 * Permanent redirects from pages that were merged into others. They run
 * before the language middleware, so each old address is listed for English
 * and for Urdu (/ur/…). Used by next.config.ts.
 */

export type Redirect = { source: string; destination: string; permanent: true };

/** Old public address → new address, without a language prefix. */
export const MOVED_PAGES: Record<string, string> = {
  // The Guide and the Resources list became parts of the Guidance page.
  "/guide": "/guidance#guide",
  "/resources": "/guidance#resources",
};

/** Old admin address → new admin address. */
export const MOVED_ADMIN_PAGES: Record<string, string> = {};

export function redirects(): Redirect[] {
  const pages = Object.entries(MOVED_PAGES).flatMap(([from, to]) => [
    { source: from, destination: to },
    { source: `/ur${from}`, destination: `/ur${to}` },
  ]);
  const admin = Object.entries(MOVED_ADMIN_PAGES).flatMap(([from, to]) => [
    { source: from, destination: to },
    { source: `${from}/:path*`, destination: `${to}/:path*` },
  ]);
  return [...pages, ...admin].map((r) => ({ ...r, permanent: true as const }));
}
