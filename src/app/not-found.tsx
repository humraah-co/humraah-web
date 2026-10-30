import Link from "next/link";

/**
 * The top-level not-found boundary. Next needs one so that a section's 404
 * ([locale]/not-found.tsx, e.g. an unknown university) renders inside the
 * page's own layout. People don't see this file: those 404s use the
 * section's page, and addresses that match no page use
 * app/global-not-found.tsx.
 *
 * Next renders this element inside every request, so it must not read
 * messages: next-intl would settle the request on English before an Urdu
 * page sets its language. That's why it has plain text and no site header.
 */
export default function RootNotFound() {
  return (
    <html lang="en">
      <body>
        <main>
          <h1>Page not found</h1>
          <p>
            <Link href="/">Go to the home page</Link>
          </p>
        </main>
      </body>
    </html>
  );
}
