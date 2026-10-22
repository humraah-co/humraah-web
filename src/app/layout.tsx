import type { Metadata, Viewport } from "next";
import { BottomNav } from "@/components/layout/BottomNav";
import { HideOnQuiz } from "@/components/layout/HideOnQuiz";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { caveat, cormorant, dmSans, nastaliq } from "./fonts";
import "./globals.css";

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

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${dmSans.variable} ${cormorant.variable} ${caveat.variable} ${nastaliq.variable}`}
    >
      <body className="flex min-h-dvh flex-col antialiased">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded-pill focus:bg-card focus:px-4 focus:py-2"
        >
          Skip to content
        </a>
        <HideOnQuiz>
          <SiteHeader />
        </HideOnQuiz>
        <main id="main" className="flex-1">
          {children}
        </main>
        <HideOnQuiz>
          <SiteFooter />
        </HideOnQuiz>
        <BottomNav />
      </body>
    </html>
  );
}
