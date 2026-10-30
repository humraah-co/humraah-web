// Standalone on purpose: next.config.ts imports this file, so it can't use
// the "@/" alias and imports nothing.

export type SecurityHeaderOptions = {
  /** NEXT_PUBLIC_SUPABASE_URL, if set. */
  supabaseUrl?: string;
  /** True for a production build (`next build`), false for `next dev`. */
  production: boolean;
  /** "enforce" turns the Content-Security-Policy on; anything else only reports violations in the browser console. */
  cspMode?: string;
};

/** The origin of a URL, or null when it isn't one. */
function originOf(url?: string) {
  if (!url) return null;
  try {
    return new URL(url).origin;
  } catch {
    return null;
  }
}

/**
 * The Content-Security-Policy.
 *
 * The site's own origin covers its pages, scripts, styles, images and the
 * self-hosted fonts (next/font copies them to our own /_next/static).
 * Supabase is the only other place the browser talks to, for sign-in
 * (connect-src). There are no third-party scripts, styles, fonts or frames.
 *
 * 'unsafe-inline' for scripts is needed because the public pages are built
 * ahead of time: Next.js puts small inline scripts in each page to start up,
 * and the theme script is inline too. A per-request nonce would force every
 * page to be rendered per request. Do NOT add a script hash (such as the
 * theme script's) next to 'unsafe-inline': browsers then ignore
 * 'unsafe-inline' and Next's own inline scripts are blocked.
 */
export function contentSecurityPolicy({ supabaseUrl, production }: SecurityHeaderOptions) {
  const supabase = originOf(supabaseUrl);
  const connect = ["'self'"];
  if (supabase) connect.push(supabase, supabase.replace(/^http/, "ws"));
  // `next dev`: hot reloading uses a websocket and React's dev tools use eval.
  if (!production) connect.push("ws://localhost:*", "ws://127.0.0.1:*");

  const directives: Record<string, string[]> = {
    "default-src": ["'self'"],
    "script-src": ["'self'", "'unsafe-inline'", ...(production ? [] : ["'unsafe-eval'"])],
    "style-src": ["'self'", "'unsafe-inline'"],
    "img-src": ["'self'", "data:", "blob:"],
    "font-src": ["'self'", "data:"],
    "connect-src": connect,
    "object-src": ["'none'"],
    "base-uri": ["'self'"],
    "form-action": ["'self'"],
    "frame-ancestors": ["'none'"],
  };
  return Object.entries(directives)
    .map(([name, sources]) => `${name} ${sources.join(" ")}`)
    .join("; ");
}

/**
 * Headers for every response. HSTS is for production builds only, so it
 * never gets pinned to http://localhost.
 *
 * The CSP starts report-only (violations show in the browser console, nothing
 * is blocked) and is enforced by setting CSP_MODE=enforce once every page has
 * been seen to load with no violations in a real browser.
 */
export function securityHeaders(options: SecurityHeaderOptions) {
  const enforce = options.cspMode === "enforce";
  const headers = [
    { key: "X-Content-Type-Options", value: "nosniff" },
    { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
    { key: "X-Frame-Options", value: "DENY" },
    {
      key: "Permissions-Policy",
      value: [
        "accelerometer=()",
        "bluetooth=()",
        "browsing-topics=()",
        "camera=()",
        "display-capture=()",
        "geolocation=()",
        "gyroscope=()",
        "magnetometer=()",
        "microphone=()",
        "midi=()",
        "payment=()",
        "serial=()",
        "usb=()",
      ].join(", "),
    },
    {
      key: enforce ? "Content-Security-Policy" : "Content-Security-Policy-Report-Only",
      value:
        contentSecurityPolicy(options) + (enforce && options.production ? "; upgrade-insecure-requests" : ""),
    },
  ];
  if (options.production) {
    headers.push({ key: "Strict-Transport-Security", value: "max-age=31536000" });
  }
  return headers;
}
