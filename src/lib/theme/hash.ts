import { createHash } from "node:crypto";
import { THEME_SCRIPT } from "./script.ts";

/**
 * The CSP source expression for the theme script, e.g. 'sha256-…'. The
 * Content-Security-Policy added on Day 6 must list it in script-src, because
 * the script is inline. theme.test.ts checks it against the script's text.
 */
export const THEME_SCRIPT_CSP_SOURCE = `'sha256-${createHash("sha256").update(THEME_SCRIPT).digest("base64")}'`;
