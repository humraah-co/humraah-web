import type { Metadata } from "next";
import { localizedPath, urduEnabled, type Locale } from "./config";

/**
 * A page's canonical address and its other-language versions, for
 * <link rel="canonical"> and <link rel="alternate" hreflang>. `path` is the
 * page without a language prefix ("/universities/qau"). English is the
 * default for anyone whose language isn't listed (x-default). Until Urdu is
 * switched on, only the English address is given.
 */
export function alternates(path: string, locale: string): Metadata["alternates"] {
  const en = localizedPath(path, "en");
  if (!urduEnabled()) return { canonical: en };
  return {
    canonical: localizedPath(path, locale === "ur" ? "ur" : "en"),
    languages: { en, ur: localizedPath(path, "ur"), "x-default": en },
  };
}

/** Open Graph's name for each language, as shown by link previews. */
export const openGraphLocale: Record<Locale, string> = { en: "en_PK", ur: "ur_PK" };
