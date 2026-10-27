/** Admin URLs, shared by the middleware, the pages and the site layout. */

export const ADMIN_HOME = "/admin";
export const ACCOUNT_PATH = "/admin/account";
export const LOGIN_PATH = "/admin/login";
export const NO_ACCESS_PATH = "/admin/no-access";
export const ACCEPT_INVITE_PATH = "/admin/accept-invite";
export const RESET_PASSWORD_PATH = "/admin/reset-password";
export const FORGOT_PASSWORD_PATH = "/admin/forgot-password";
export const AUTH_CONFIRM_PATH = "/admin/auth/confirm";

export function isAdminPath(pathname: string) {
  return pathname === ADMIN_HOME || pathname.startsWith(`${ADMIN_HOME}/`);
}

/**
 * Pages that work without an active team membership: signing in, resetting
 * a password and accepting an invite. Each one checks the session it needs.
 */
const openPaths = [
  LOGIN_PATH,
  FORGOT_PASSWORD_PATH,
  RESET_PASSWORD_PATH,
  ACCEPT_INVITE_PATH,
  AUTH_CONFIRM_PATH,
];

export function isOpenAdminPath(pathname: string) {
  return openPaths.includes(pathname);
}

/**
 * A "?next=" value that is safe to redirect to: an admin page on this site,
 * and not one of the sign-in pages (which would loop).
 */
export function safeNextPath(value: unknown): string | null {
  if (typeof value !== "string" || !value.startsWith("/") || value.startsWith("//") || value.includes("\\")) {
    return null;
  }
  const pathname = value.split(/[?#]/)[0];
  if (!isAdminPath(pathname) || isOpenAdminPath(pathname)) return null;
  return value;
}
