import type { CookieOptions } from "@supabase/ssr";

/**
 * "Keep me signed in" on the admin sign-in page. Without this cookie the
 * session cookies are written without an expiry, so the browser forgets
 * them when it closes.
 */
export const KEEP_SIGNED_IN_COOKIE = "humraah-keep-signed-in";

export const keepSignedInCookieOptions = {
  httpOnly: true,
  sameSite: "lax",
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: 60 * 60 * 24 * 400,
} as const;

/** Session cookie options for this browser: drops the expiry unless the person chose to stay signed in. */
export function sessionCookieOptions(options: CookieOptions, keep: boolean): CookieOptions {
  // maxAge 0 is how a cookie gets deleted on sign-out; leave that alone.
  if (keep || options.maxAge === 0) return options;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- dropped on purpose
  const { maxAge, expires, ...rest } = options;
  return rest;
}
