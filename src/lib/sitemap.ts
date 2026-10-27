import { enabledLocales, localizedPath, type Locale } from "../i18n/config.ts";

/** Pages that don't depend on the database. (Not the quiz results, nor the phone-only menu.) */
export const STATIC_PAGES = [
  "/",
  "/universities",
  "/scholarships",
  "/explore",
  "/guidance",
  "/resources",
  "/guide",
  "/quiz",
  "/about",
  "/privacy",
] as const;

export type SitemapSlugs = {
  universities: string[];
  scholarships: string[];
  fields: string[];
  guidance: string[];
};

export type SitemapEntry = {
  url: string;
  alternates?: { languages: Record<string, string> };
};

/**
 * Every public page in every language that's switched on, each with its
 * other-language versions as hreflang alternates (plus x-default, English).
 * `slugs` must hold published entries only (the public queries return
 * nothing else). With Urdu off, English addresses only and no alternates.
 */
export function buildSitemap(site: string, slugs: SitemapSlugs, urduEnabled: boolean): SitemapEntry[] {
  const locales: Locale[] = enabledLocales(urduEnabled);
  const paths: string[] = [
    ...STATIC_PAGES,
    ...slugs.universities.map((s) => `/universities/${s}`),
    ...slugs.scholarships.map((s) => `/scholarships/${s}`),
    ...slugs.fields.map((s) => `/explore/${s}`),
    ...slugs.guidance.map((s) => `/guidance/${s}`),
  ];
  const address = (path: string, locale: Locale) => `${site}${localizedPath(path, locale)}`;
  return paths.flatMap((path) =>
    locales.map((locale) => {
      const entry: SitemapEntry = { url: address(path, locale) };
      if (urduEnabled) {
        entry.alternates = {
          languages: { en: address(path, "en"), ur: address(path, "ur"), "x-default": address(path, "en") },
        };
      }
      return entry;
    }),
  );
}
