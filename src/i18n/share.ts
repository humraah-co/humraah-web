import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { toLocale, urduEnabled } from "./config";
import { openGraphLocale } from "./metadata";

/** The one share image, drawn in src/app/og-default.png/route.tsx. */
export const SHARE_IMAGE = { url: "/og-default.png", width: 1200, height: 630 } as const;

/**
 * Adds the link-preview tags (Open Graph and Twitter) to a page's metadata,
 * from the title, description and canonical address it already has: the
 * same words, in the page's language, with the right locale. A page's own
 * openGraph replaces the layout's whole, so the site name, locale and
 * image are repeated here. Without a title the layout's default is used.
 */
export async function withShare(metadata: Metadata, localeParam: string): Promise<Metadata> {
  const locale = toLocale(localeParam);
  const t = await getTranslations({ locale, namespace: "layout" });
  const title = typeof metadata.title === "string" ? metadata.title : t("title");
  const description = metadata.description ?? t("description");
  const canonical = metadata.alternates?.canonical;
  const images = [{ ...SHARE_IMAGE, alt: t("siteName") }];
  return {
    ...metadata,
    openGraph: {
      type: "website",
      title,
      description,
      url: typeof canonical === "string" ? canonical : undefined,
      siteName: t("siteName"),
      locale: openGraphLocale[locale],
      alternateLocale: urduEnabled() ? openGraphLocale[locale === "en" ? "ur" : "en"] : undefined,
      images,
    },
    twitter: { card: "summary_large_image", title, description, images },
  };
}
