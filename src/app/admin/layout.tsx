import type { Metadata, Viewport } from "next";
import { NextIntlClientProvider } from "next-intl";
import { clientMessages } from "@/i18n/messages";
import { ThemeScript } from "@/components/ui/ThemeScript";
import { THEME_COLORS } from "@/lib/theme/script";
import { caveat, cormorant, dmSans, nastaliq } from "../fonts";
import "../globals.css";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

// The team workspace is its own root layout (the public site's is per
// language, in app/[locale]). It stays in English; the sign-in pages and
// the workspace each add their own header.
export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: "Team workspace", template: "%s · Humraah team" },
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: THEME_COLORS.light },
    { media: "(prefers-color-scheme: dark)", color: THEME_COLORS.dark },
  ],
};

// Every /admin page is for one signed-in person: render it per request,
// never at build time and never from a shared cache.
export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${dmSans.variable} ${cormorant.variable} ${caveat.variable} ${nastaliq.variable}`}
    >
      <head>
        <ThemeScript />
      </head>
      <body className="flex min-h-dvh flex-col antialiased">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded-pill focus:bg-card focus:px-4 focus:py-2"
        >
          Skip to content
        </a>
        <main id="main" className="flex-1">
          {/* The shared buttons, badges and logo read their English text from the messages. */}
          <NextIntlClientProvider messages={await clientMessages(["brand", "common", "badges", "theme"])}>
            {children}
          </NextIntlClientProvider>
        </main>
      </body>
    </html>
  );
}
