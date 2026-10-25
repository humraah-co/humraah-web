import type { Metadata, Viewport } from "next";
import { notFound } from "next/navigation";
import { hasLocale } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { BottomNav } from "@/components/layout/BottomNav";
import { HideOnFocusedPages } from "@/components/layout/HideOnFocusedPages";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { directionFor } from "@/i18n/config";
import { routing } from "@/i18n/routing";
import { caveat, cormorant, dmSans, nastaliq } from "../fonts";
import "../globals.css";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Humraah – higher education guidance for girls in Pakistan",
    template: "%s · Humraah",
  },
  description:
    "Find out what you could study, which universities offer it and how to pay for it. Humraah walks alongside girls in Pakistan towards higher education.",
  openGraph: { siteName: "Humraah", locale: "en_PK", type: "website" },
};

export const viewport: Viewport = {
  themeColor: "#f7f1ec",
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
  return (
    <html
      lang={locale}
      dir={directionFor(locale)}
      className={`${dmSans.variable} ${cormorant.variable} ${caveat.variable} ${nastaliq.variable}`}
    >
      <body className="flex min-h-dvh flex-col antialiased">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded-pill focus:bg-card focus:px-4 focus:py-2"
        >
          Skip to content
        </a>
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
      </body>
    </html>
  );
}
