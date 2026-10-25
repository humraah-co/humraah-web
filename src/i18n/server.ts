import "server-only";
import { setRequestLocale } from "next-intl/server";
import { DEFAULT_LOCALE, isEnabledLocale, type Locale } from "./config.ts";

/** Route params of every public page: the [locale] segment, plus the page's own. */
export type LocaleParams<P = object> = Promise<P & { locale: string }>;

/**
 * The page's language, from its [locale] segment. Call it first in every
 * public page: it tells next-intl the language without reading request
 * headers, which keeps the page static. (The layout has already sent
 * unknown locales to the 404 page.)
 */
export async function pageLocale(params: LocaleParams): Promise<Locale> {
  const { locale } = await params;
  const resolved = isEnabledLocale(locale) ? locale : DEFAULT_LOCALE;
  setRequestLocale(resolved);
  return resolved;
}
