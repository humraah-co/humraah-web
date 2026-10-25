import { stripLocale, type Locale } from "./config.ts";

/**
 * What the middleware does with a public request, as a pure function so the
 * rules can be tested without a server:
 *
 * - A link always opens in its own language, for everyone: /universities/qau
 *   is English and /ur/universities/qau is Urdu, whatever the cookie says.
 * - Visiting an Urdu page remembers the choice (cookie). Only the home page,
 *   "/", acts on it, sending a visitor who chose Urdu to "/ur". Crawlers are
 *   never redirected.
 * - "?lang=en" (the pill's link back to English) remembers English and
 *   returns to the same page without the parameter. It works without JavaScript.
 * - "/en/…" is served as it is. It's the app's own address for English
 *   pages (what the rewrite below points at), so it must never redirect:
 *   on some hosts the rewritten request passes through here again, and a
 *   redirect would loop. Its canonical link points at the unprefixed page.
 * - Everything else is served from the English pages (/en/… inside the app).
 */

export type LocaleRoute =
  | { kind: "admin" }
  | { kind: "rewrite"; to: string }
  | { kind: "next"; setCookie?: Locale }
  | { kind: "redirect"; to: string; setCookie?: Locale };

const BOT =
  /bot|crawl|spider|slurp|archiver|facebookexternalhit|preview|whatsapp|telegram|discord|embedly|lighthouse/i;

export function decideLocaleRoute({
  pathname,
  search,
  cookie,
  userAgent,
  enabled,
}: {
  pathname: string;
  /** "" or "?q=…" */
  search: string;
  /** The NEXT_LOCALE cookie, if any. */
  cookie: string | undefined;
  userAgent: string | undefined;
  /** NEXT_PUBLIC_URDU_ENABLED */
  enabled: boolean;
}): LocaleRoute {
  if (pathname === "/admin" || pathname.startsWith("/admin/")) return { kind: "admin" };

  const params = new URLSearchParams(search);
  if (params.get("lang") === "en") {
    params.delete("lang");
    const rest = params.toString();
    return { kind: "redirect", to: stripLocale(pathname) + (rest ? `?${rest}` : ""), setCookie: "en" };
  }

  if (pathname === "/en" || pathname.startsWith("/en/")) return { kind: "next" };

  const urduPage = pathname === "/ur" || pathname.startsWith("/ur/");
  if (enabled && urduPage) return cookie === "ur" ? { kind: "next" } : { kind: "next", setCookie: "ur" };

  if (enabled && pathname === "/" && cookie === "ur" && !BOT.test(userAgent ?? "")) {
    return { kind: "redirect", to: `/ur${search}` };
  }

  // With Urdu off, /ur/… lands here too and gets the English 404.
  return { kind: "rewrite", to: `/en${pathname === "/" ? "" : pathname}${search}` };
}
