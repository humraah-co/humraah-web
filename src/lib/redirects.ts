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

/**
 * Old admin addresses. Resources and Guidance articles are one admin page,
 * "Guidance and resources", at /admin/guidance. The resource list is a tab
 * of it; the resource editors moved under /admin/guidance/resources.
 */
export const MOVED_ADMIN_PAGES: { source: string; destination: string }[] = [
  { source: "/admin/resources", destination: "/admin/guidance?type=resources" },
  { source: "/admin/resources/:path*", destination: "/admin/guidance/resources/:path*" },
];

export function redirects(): Redirect[] {
  const pages = Object.entries(MOVED_PAGES).flatMap(([from, to]) => [
    { source: from, destination: to },
    { source: `/ur${from}`, destination: `/ur${to}` },
  ]);
  const admin = MOVED_ADMIN_PAGES;
  return [...pages, ...admin].map((r) => ({ ...r, permanent: true as const }));
}
