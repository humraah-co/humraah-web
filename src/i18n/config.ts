/**
 * Languages of the public site. English is the default and has no prefix
 * (/universities); Urdu lives under /ur (/ur/universities).
 *
 * Urdu is behind NEXT_PUBLIC_URDU_ENABLED until a native speaker has
 * reviewed it. While it's off, "ur" isn't a locale at all: /ur pages are
 * never built and return 404, and the header pill says "Urdu coming soon".
 *
 * No framework imports here, so the routing tests can load this file directly.
 */

export const LOCALES = ["en", "ur"] as const;
export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "en";

/** Remembers the visitor's choice; only the home page acts on it (see decideLocaleRoute). */
export const LOCALE_COOKIE = "NEXT_LOCALE";
export const LOCALE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

/** The flag. Read as a literal so Next inlines it at build time. */
export function urduEnabled(value: string | undefined = process.env.NEXT_PUBLIC_URDU_ENABLED) {
  return value === "true";
}

/** The locales that exist right now: English always, Urdu only when the flag is on. */
export function enabledLocales(enabled = urduEnabled()): Locale[] {
  return enabled ? ["en", "ur"] : ["en"];
}

export function isEnabledLocale(value: unknown, enabled = urduEnabled()): value is Locale {
  return (enabledLocales(enabled) as string[]).includes(value as string);
}

export const directionFor = (locale: Locale) => (locale === "ur" ? "rtl" : "ltr");

/** "/ur/universities" (or the internal "/en/universities") → "/universities". */
export function stripLocale(pathname: string) {
  // "/en/…" is the internal address English pages render at, seen while they are built.
  for (const prefix of ["/ur", "/en"]) {
    if (pathname === prefix) return "/";
    if (pathname.startsWith(`${prefix}/`)) return pathname.slice(prefix.length);
  }
  return pathname;
}

/** The same page in `locale`: "/universities" ↔ "/ur/universities". */
export function localizedPath(pathname: string, locale: Locale) {
  const path = stripLocale(pathname);
  if (locale === DEFAULT_LOCALE) return path;
  return path === "/" ? `/${locale}` : `/${locale}${path}`;
}
