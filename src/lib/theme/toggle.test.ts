// The header control offers Light, Dark and System; the root layouts carry the script.
// Run with: npm run test:theme
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { THEME_CHOICES } from "./script.ts";

const read = (path: string) => readFileSync(new URL(path, import.meta.url), "utf8");
const toggle = read("../../components/ui/ThemeToggle.tsx");

test("the control offers exactly Light, Dark and System, each with an icon and a name", () => {
  assert.deepEqual([...THEME_CHOICES], ["light", "dark", "system"]);
  assert.match(toggle, /light: Sun, dark: Moon, system: Monitor/);
  assert.match(toggle, /t\(value\)/);
});

test("it says which choice is active without relying on colour, and has accessible names", () => {
  assert.match(toggle, /aria-pressed=\{active\}/);
  assert.match(toggle, /<Check /);
  assert.match(toggle, /aria-expanded=\{open\}/);
  assert.match(toggle, /aria-label=\{t\("current", \{ theme: t\(choice\) \}\)\}/);
  assert.match(toggle, /event\.key === "Escape"/);
});

test("the choice is saved in storage that may be blocked, and the default is not the computer's setting", () => {
  assert.match(toggle, /try \{\s*localStorage\.setItem/);
  assert.match(toggle, /try \{\s*return parseChoice\(localStorage\.getItem/);
  // The server and a blocked storage both render the default.
  assert.match(toggle, /\(\) => DEFAULT_CHOICE/);
});

test("the messages for the control exist in both languages, and the old single label is gone", () => {
  for (const lang of ["en", "ur"]) {
    const { theme } = JSON.parse(read(`../../messages/${lang}.json`));
    assert.deepEqual(Object.keys(theme).sort(), ["current", "dark", "label", "light", "system"], lang);
  }
});

test("both layouts start the browser's theme-color on light", () => {
  for (const file of ["../../app/[locale]/layout.tsx", "../../app/admin/layout.tsx"]) {
    const source = read(file);
    assert.match(source, /themeColor: THEME_COLORS\.light/, file);
    assert.doesNotMatch(source, /prefers-color-scheme/, file);
  }
});
