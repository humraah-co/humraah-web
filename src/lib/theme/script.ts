/**
 * The light/dark theme is the data-theme attribute on <html>, which
 * globals.css turns into colours. This file is the one place that names the
 * attribute, where the choice is remembered, how a choice becomes a theme,
 * and the one tiny script that sets it before first paint.
 *
 * A visitor has three choices: Light, Dark or System (follow the computer).
 * With no saved choice the site is Light, whatever the computer is set to.
 */

export const THEME_ATTRIBUTE = "data-theme";
/** localStorage key holding the saved choice: "light", "dark" or "system". Earlier versions saved "light" or "dark" here, which still mean the same. */
export const THEME_STORAGE_KEY = "humraah-theme";
export const THEMES = ["light", "dark"] as const;
export type Theme = (typeof THEMES)[number];
export const THEME_CHOICES = ["light", "dark", "system"] as const;
export type ThemeChoice = (typeof THEME_CHOICES)[number];
/** What a visitor with no saved (or an unreadable) choice gets. */
export const DEFAULT_CHOICE: ThemeChoice = "light";

/** The page background in each theme, for the browser's address bar (<meta name="theme-color">). Match --color-cream in globals.css. */
export const THEME_COLORS: Record<Theme, string> = { light: "#f7f1ec", dark: "#1f1b18" };

/** A saved value as a choice: anything that isn't one of the three (nothing saved, garbled) is the default, Light. */
export function parseChoice(saved: unknown): ThemeChoice {
  return THEME_CHOICES.find((c) => c === saved) ?? DEFAULT_CHOICE;
}

/** The theme to show for a saved value. The computer's setting only matters for "system". */
export function resolveTheme(saved: unknown, computerPrefersDark: boolean): Theme {
  const choice = parseChoice(saved);
  if (choice === "system") return computerPrefersDark ? "dark" : "light";
  return choice;
}

/**
 * Runs inside <head>, before the body is parsed, so the first paint already
 * has the right colours: the saved choice, else Light. For "system" it asks
 * the computer's setting, and keeps listening, so the page follows the
 * computer while it is open (and only while "system" is the saved choice:
 * every change re-reads the saved choice). Storage can be blocked (private
 * windows), so every read is guarded; the result is then Light. It keeps the
 * address bar colour (<meta name="theme-color">) in step too.
 *
 * It is a fixed string with no per-request values, so a page that includes it can
 * still be built ahead of time and cached, and a Content-Security-Policy
 * can allow it by hash instead of a nonce (a nonce would force every page to
 * render per request): add THEME_SCRIPT_CSP_SOURCE (hash.ts) to script-src.
 * Keep its rules the same as resolveTheme above (script.test.ts compares them).
 */
export const THEME_SCRIPT = `(function(){var d=document.documentElement,c=${JSON.stringify(THEME_COLORS)},q;try{q=matchMedia("(prefers-color-scheme: dark)")}catch(e){}function r(){var s,t="light";try{s=localStorage.getItem(${JSON.stringify(THEME_STORAGE_KEY)})}catch(e){}if(s==="dark")t="dark";else if(s==="system"){try{if(q.matches)t="dark"}catch(e){}}d.setAttribute(${JSON.stringify(THEME_ATTRIBUTE)},t);var m=document.querySelectorAll('meta[name="theme-color"]');for(var i=0;i<m.length;i++)m[i].setAttribute("content",c[t])}r();try{q.addEventListener("change",r)}catch(e){try{q.addListener(r)}catch(e2){}}})();`;
