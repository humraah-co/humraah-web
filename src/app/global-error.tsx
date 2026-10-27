"use client";

import { buttonStyles } from "@/components/ui/Button";
import { ThemeScript } from "@/components/ui/ThemeScript";
import { caveat, cormorant, dmSans, nastaliq } from "./fonts";
import "./globals.css";

/**
 * The last resort: a layout itself failed, so no language, header or message
 * is available (the translations are part of what broke). It renders its
 * own document and says the same thing in English and in Urdu, with a way
 * back home. No technical details are shown.
 */
export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${dmSans.variable} ${cormorant.variable} ${caveat.variable} ${nastaliq.variable}`}
    >
      <head>
        <title>Something went wrong · کچھ گڑبڑ ہو گئی</title>
        <meta name="robots" content="noindex" />
        <ThemeScript />
      </head>
      <body className="flex min-h-dvh flex-col items-center justify-center gap-10 px-4 py-16 text-center antialiased">
        <section lang="en" dir="ltr" className="flex max-w-md flex-col items-center gap-3">
          <h1 className="text-h1">Sorry, this page isn&apos;t working</h1>
          <p className="text-body-m text-muted">
            It&apos;s not you. Please try again in a moment, or go back to the home page.
          </p>
        </section>
        <section lang="ur" dir="rtl" className="flex max-w-md flex-col items-center gap-3">
          <h2 className="text-h1">معذرت، یہ صفحہ ابھی نہیں چل رہا</h2>
          <p className="text-body-m text-muted">
            اس میں آپ کا کوئی قصور نہیں۔ براہِ کرم تھوڑی دیر بعد دوبارہ کوشش کریں، یا ہوم پیج پر واپس جائیں۔
          </p>
        </section>
        <div className="flex flex-wrap justify-center gap-3">
          <button type="button" onClick={reset} className={buttonStyles.primary}>
            Try again · دوبارہ کوشش کریں
          </button>
          {/* A plain link: a full page load, so nothing from the failed page is kept. */}
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- the app's router may be what broke */}
          <a href="/" className={buttonStyles.secondary}>
            Home · ہوم پیج
          </a>
        </div>
      </body>
    </html>
  );
}
