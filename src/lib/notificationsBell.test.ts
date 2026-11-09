// Guardrails for the notifications bell. There is no browser in these
// tests, so they read the source for the behaviour that matters most:
// keyboard and screen reader support, right-to-left placement, the places it
// appears, and that its data call can't break a page. Run with: npm run test:unit
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const read = (path: string) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
const bell = read("components/layout/NotificationsBell.tsx");

test("the bell is a real button that names its state and count", () => {
  assert.match(bell, /<button[\s\S]*?type="button"/);
  assert.match(bell, /aria-expanded=\{open\}/);
  assert.match(bell, /aria-controls=\{panelId\}/);
  assert.match(bell, /t\("labelCount", \{ count \}\)/);
});

test("Escape and an outside click close it, and Escape returns focus to the bell", () => {
  assert.match(bell, /event\.key !== "Escape"/);
  assert.match(bell, /button\.current\?\.focus\(\)/);
  assert.match(bell, /addEventListener\("pointerdown"/);
  assert.match(bell, /addEventListener\("focusin"/);
});

test("the panel is anchored with logical positions, so it works right to left", () => {
  assert.match(bell, /absolute end-0/);
  assert.doesNotMatch(bell, /\b(?:left|right)-\d|\b(?:ml|mr|pl|pr)-\d/);
});

test("the badge is left out at zero and the list can show its empty state", () => {
  assert.match(bell, /count > 0 &&/);
  assert.match(bell, /t\("empty"\)/);
});

test("dates are written in the page language", () => {
  assert.match(bell, /formatLongDate\(d\.date, locale\)/);
  assert.match(bell, /useLocale\(\)/);
});

test("it appears in the desktop header and on the phone menu", () => {
  assert.match(read("components/layout/SiteHeader.tsx"), /<NotificationsBell \/>/);
  assert.match(read("app/[locale]/menu/page.tsx"), /<NotificationsBell variant="row" \/>/);
});

test("a failed request shows the empty state instead of an error", () => {
  const hook = read("components/layout/useDeadlines.ts");
  assert.match(hook, /\.catch\(\(\) => \[\] as Deadline\[\]\)/);
  assert.match(read("lib/data/public.ts"), /catch \{\s*return \[\];\s*\}/);
});

test("the bell's messages exist in English and Urdu with the count placeholder", () => {
  for (const lang of ["en", "ur"]) {
    const messages = JSON.parse(read(`messages/${lang}.json`)).notifications as Record<string, unknown>;
    assert.match(String(messages.labelCount), /\{count\}/);
    assert.match(String(messages.daysLeft), /\{count, plural,/);
    assert.ok(String(messages.empty).length > 10);
  }
});
