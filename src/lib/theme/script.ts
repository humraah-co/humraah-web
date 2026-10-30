/**
 * The light/dark theme is the data-theme attribute on <html>, which
 * globals.css turns into colours. This file is the one place that names the
 * attribute, where the choice is remembered and the one tiny script that
 * sets it before first paint.
 */

export const THEME_ATTRIBUTE = "data-theme";
/** localStorage key holding "light" or "dark" once the person has chosen. */
export const THEME_STORAGE_KEY = "humraah-theme";
export const THEMES = ["light", "dark"] as const;
export type Theme = (typeof THEMES)[number];

/** The page background in each theme, for the browser's address bar (<meta name="theme-color">). Match --color-cream in globals.css. */
export const THEME_COLORS: Record<Theme, string> = { light: "#f7f1ec", dark: "#1f1b18" };

/**
 * Runs inside <head>, before the body is parsed, so the first paint already
 * has the right colours: the saved choice if there is one, otherwise the
 * device setting. Storage can be blocked (private windows), so every read
 * is guarded and the device setting still applies.
 *
 * It is a fixed string with no per-request values, so a page that includes it can
 * still be built ahead of time and cached, and a Content-Security-Policy
 * can allow it by hash instead of a nonce (a nonce would force every page to
 * render per request): add THEME_SCRIPT_CSP_SOURCE (hash.ts) to script-src.
 */
export const THEME_SCRIPT = `(function(){var d=document.documentElement,t;try{t=localStorage.getItem(${JSON.stringify(THEME_STORAGE_KEY)})}catch(e){}if(t!=="light"&&t!=="dark"){try{t=matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light"}catch(e){t="light"}}d.setAttribute(${JSON.stringify(THEME_ATTRIBUTE)},t);var c=${JSON.stringify(THEME_COLORS)}[t],m=document.querySelectorAll('meta[name="theme-color"]');for(var i=0;i<m.length;i++)m[i].setAttribute("content",c)})();`;
