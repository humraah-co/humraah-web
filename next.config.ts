import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

// Loads src/i18n/request.ts, which picks each request's messages (English or Urdu).
const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

// Baseline security headers. A full Content-Security-Policy is added on Day 6
// once every third-party origin the site needs is known.
const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
      // The team workspace stays out of search results.
      { source: "/admin/:path*", headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }] },
    ];
  },
};

export default withNextIntl(nextConfig);
