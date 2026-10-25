import { NextIntlClientProvider } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { BottomNav } from "@/components/layout/BottomNav";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { DEFAULT_LOCALE } from "@/i18n/config";
import { clientMessages } from "@/i18n/messages";
import LocaleNotFound from "./[locale]/not-found";
import { caveat, cormorant, dmSans, nastaliq } from "./fonts";
import "./globals.css";

/**
 * The 404 for any address that isn't a page at all (e.g. /no-such-page).
 * Next builds it once as a static page, so it arrives complete, with the
 * site header and footer. A missing entry inside a section (an unknown
 * university, say) uses [locale]/not-found.tsx instead, in the page's language.
 *
 * The top-level layout only passes children through, so this page renders
 * its own document, like the two real root layouts. It has no language
 * segment, so it is in English.
 */
export default async function GlobalNotFound() {
  setRequestLocale(DEFAULT_LOCALE);
  const t = await getTranslations("layout");
  return (
    <html
      lang="en"
      dir="ltr"
      className={`${dmSans.variable} ${cormorant.variable} ${caveat.variable} ${nastaliq.variable}`}
    >
      <body className="flex min-h-dvh flex-col antialiased">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:start-2 focus:top-2 focus:z-50 focus:rounded-pill focus:bg-card focus:px-4 focus:py-2"
        >
          {t("skipToContent")}
        </a>
        <NextIntlClientProvider messages={await clientMessages()}>
          <SiteHeader />
          <main id="main" className="flex-1">
            <LocaleNotFound />
          </main>
          <SiteFooter />
          <BottomNav />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
