import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";
import { securityHeaders } from "./src/lib/securityHeaders";

// Loads src/i18n/request.ts, which picks each request's messages (English or Urdu).
const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

// Security headers, including the Content-Security-Policy, are built in
// src/lib/securityHeaders.ts. The CSP is report-only until CSP_MODE=enforce.
const headersForEveryPage = securityHeaders({
  production: process.env.NODE_ENV === "production",
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
  cspMode: process.env.CSP_MODE,
});

const nextConfig: NextConfig = {
  poweredByHeader: false,
  // The page-render test (src/i18n/intl-errors.test.ts) runs its own dev
  // server in another folder, so it never disturbs a running `npm run dev`.
  distDir: process.env.NEXT_DIST_DIR || ".next",
  // app/global-not-found.tsx: the 404 for addresses that match no page. The
  // site's real root layouts are per area (public and admin).
  experimental: { globalNotFound: true },
  async headers() {
    return [
      { source: "/:path*", headers: headersForEveryPage },
      // The team workspace stays out of search results.
      { source: "/admin/:path*", headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }] },
    ];
  },
};

export default withNextIntl(nextConfig);
