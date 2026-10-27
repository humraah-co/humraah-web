// The colour tokens in src/app/globals.css, for the theme tests: the @theme
// block is the light theme, :root[data-theme="dark"] overrides it for dark.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const css = readFileSync(new URL("../../app/globals.css", import.meta.url), "utf8");

/** The `{ … }` body that follows the first occurrence of `opener`. */
function block(opener: string) {
  const start = css.indexOf(opener);
  assert.notEqual(start, -1, `${opener} not found in globals.css`);
  const open = css.indexOf("{", start);
  const close = css.indexOf("\n}", open);
  return css.slice(open + 1, close);
}

export function colours(body: string) {
  const out: Record<string, string> = {};
  for (const m of body.matchAll(/--color-([a-z-]+):\s*(#[0-9a-fA-F]{6})\b/g)) out[m[1]] = m[2].toLowerCase();
  return out;
}

export const darkOverrides = colours(block(':root[data-theme="dark"]'));
export const light = colours(block("@theme"));
export const dark = { ...light, ...darkOverrides };
export const themes = { light, dark } as const;

export function luminance(hex: string) {
  const [r, g, b] = [1, 3, 5]
    .map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrast(a: string, b: string) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}
