// Public pages must show one language at a time. Urdu text belongs in
// src/messages/ur.json (shown only on Urdu pages), never written into a
// component, where it would appear beside the English. Run with: npm run test:unit
import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";

const root = new URL("..", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1");
const urdu = /[؀-ۿ]/;

/**
 * Files (paths from src/, with forward slashes) that may hold Urdu letters:
 * the language switch names each language in its own script, the brand
 * lockup carries the name in both scripts, two helpers hold an Urdu word
 * used only to match or join text, the admin area is a separate English
 * workspace, and the last-resort error pages can't know the language.
 */
const allowed = [
  "components/layout/LanguageSwitch.tsx",
  "components/brand/Logo.tsx",
  "components/content/Cards.tsx",
  "lib/format.ts",
  "components/admin/",
  "app/admin/",
  "app/global-error.tsx",
  "app/global-not-found.tsx",
  "app/not-found.tsx",
];

function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return sourceFiles(path);
    return /\.(tsx?|css)$/.test(name) && !/\.test\.ts$/.test(name) ? [path] : [];
  });
}

test("no component or page writes Urdu text beside the English", () => {
  const offenders = ["components", "app", "config", "content", "lib"]
    .flatMap((d) => sourceFiles(join(root, d)))
    .map((f) => f.slice(root.length).replaceAll("\\", "/"))
    .filter((f) => !allowed.some((a) => (a.endsWith("/") ? f.startsWith(a) : f === a)))
    .filter((f) => urdu.test(readFileSync(join(root, f), "utf8")));
  assert.deepEqual(offenders, []);
});

test("the Guide's PDF names come from the message files, one language at a time", () => {
  const names = (lang: string) =>
    JSON.parse(readFileSync(join(root, "messages", `${lang}.json`), "utf8")).guide.languages as Record<
      string,
      string
    >;
  assert.deepEqual(names("en"), { en: "English", ur: "Urdu" });
  assert.ok(urdu.test(names("ur").en) && urdu.test(names("ur").ur));
});
