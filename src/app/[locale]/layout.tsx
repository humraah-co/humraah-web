import type { Metadata, Viewport } from "next";
import { notFound } from "next/navigation";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { BottomNav } from "@/components/layout/BottomNav";
import { HideOnFocusedPages } from "@/components/layout/HideOnFocusedPages";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { directionFor, urduEnabled } from "@/i18n/config";
import { openGraphLocale } from "@/i18n/metadata";
import { clientMessages } from "@/i18n/messages";
import { routing } from "@/i18n/routing";
import { ThemeScript } from "@/components/ui/ThemeScript";
import { THEME_COLORS } from "@/lib/theme/script";
import { caveat, cormorant, dmSans, nastaliq } from "../fonts";
import "../globals.css";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) return {};
  const t = await getTranslations({ locale, namespace: "layout" });
  return {
    metadataBase: new URL(siteUrl),
    title: { default: t("title"), template: t("titleTemplate") },
    description: t("description"),
    openGraph: {
      siteName: t("siteName"),
      locale: openGraphLocale[locale],
      alternateLocale: urduEnabled() ? openGraphLocale[locale === "en" ? "ur" : "en"] : undefined,
      type: "website",
    },
  };
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: THEME_COLORS.light },
    { media: "(prefers-color-scheme: dark)", color: THEME_COLORS.dark },
  ],
};

/** Every page is built for each language that's switched on (English, plus Urdu behind the flag). */
export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

/** The public site's root layout: one per language, with the page's lang and direction. */
export default async function LocaleLayout({
  children,
  params,
}: Readonly<{ children: React.ReactNode; params: Promise<{ locale: string }> }>) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  const t = await getTranslations("layout");
  return (
    <html
      lang={locale}
      dir={directionFor(locale)}
      suppressHydrationWarning
      className={`${dmSans.variable} ${cormorant.variable} ${caveat.variable} ${nastaliq.variable}`}
    >
      <head>
        <ThemeScript />
      </head>
      <body className="flex min-h-dvh flex-col antialiased">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:start-2 focus:top-2 focus:z-50 focus:rounded-pill focus:bg-card focus:px-4 focus:py-2"
        >
          {t("skipToContent")}
        </a>
        <NextIntlClientProvider messages={await clientMessages()}>
          <HideOnFocusedPages>
            <SiteHeader />
          </HideOnFocusedPages>
          <main id="main" className="flex-1">
            {children}
          </main>
          <HideOnFocusedPages>
            <SiteFooter />
          </HideOnFocusedPages>
          <BottomNav />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
