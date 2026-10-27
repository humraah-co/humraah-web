// The theme script must set data-theme on <html> before first paint, from
// the saved choice or else the device setting, and every root layout must
// put it in <head>, ahead of the body. Run with: npm run test:theme
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { runInNewContext } from "node:vm";
import { test } from "node:test";
import { THEME_SCRIPT_CSP_SOURCE } from "./hash.ts";
import { THEME_ATTRIBUTE, THEME_COLORS, THEME_SCRIPT, THEME_STORAGE_KEY } from "./script.ts";

type Env = {
  stored?: string | null;
  prefersDark?: boolean;
  storageThrows?: boolean;
  matchMediaThrows?: boolean;
};

/** Runs the script against a fake page and returns what it did to <html> and the theme-color tags. */
function run({ stored = null, prefersDark = false, storageThrows = false, matchMediaThrows = false }: Env) {
  const attributes: Record<string, string> = {};
  const metas = [0, 1].map(() => {
    const meta = {
      content: "",
      setAttribute(name: string, value: string) {
        if (name === "content") meta.content = value;
      },
    };
    return meta;
  });
  const document = {
    documentElement: { setAttribute: (name: string, value: string) => (attributes[name] = value) },
    querySelectorAll: () => metas,
  };
  const localStorage = {
    getItem(key: string) {
      if (storageThrows) throw new Error("blocked");
      assert.equal(key, THEME_STORAGE_KEY);
      return stored;
    },
  };
  const matchMedia = (query: string) => {
    if (matchMediaThrows) throw new Error("unsupported");
    assert.equal(query, "(prefers-color-scheme: dark)");
    return { matches: prefersDark };
  };
  runInNewContext(THEME_SCRIPT, { document, localStorage, matchMedia });
  return { theme: attributes[THEME_ATTRIBUTE], metas: metas.map((m) => m.content) };
}

test("the script is plain JavaScript that sets the attribute synchronously", () => {
  assert.equal(run({}).theme, "light");
  assert.doesNotMatch(
    THEME_SCRIPT,
    /async|await|setTimeout|addEventListener|DOMContentLoaded|requestAnimationFrame/,
  );
});

test("first visit follows the device setting", () => {
  assert.equal(run({ prefersDark: true }).theme, "dark");
  assert.equal(run({ prefersDark: false }).theme, "light");
});

test("a saved choice beats the device setting", () => {
  assert.equal(run({ stored: "light", prefersDark: true }).theme, "light");
  assert.equal(run({ stored: "dark", prefersDark: false }).theme, "dark");
});

test("a garbled saved value is ignored", () => {
  assert.equal(run({ stored: "purple", prefersDark: true }).theme, "dark");
});

test("blocked storage or an unsupported media query still ends with a theme", () => {
  assert.equal(run({ storageThrows: true, prefersDark: true }).theme, "dark");
  assert.equal(run({ storageThrows: true, matchMediaThrows: true }).theme, "light");
  assert.equal(run({ stored: "dark", matchMediaThrows: true }).theme, "dark");
});

test("the browser's theme-color follows the theme", () => {
  assert.deepEqual(run({ stored: "dark" }).metas, [THEME_COLORS.dark, THEME_COLORS.dark]);
  assert.deepEqual(run({ stored: "light" }).metas, [THEME_COLORS.light, THEME_COLORS.light]);
});

test("every root layout puts the script in <head>, before the body", () => {
  const layouts = [
    "../../app/[locale]/layout.tsx",
    "../../app/admin/layout.tsx",
    "../../app/global-not-found.tsx",
  ];
  for (const file of layouts) {
    const source = readFileSync(new URL(file, import.meta.url), "utf8");
    const head = source.indexOf("<head>");
    const script = source.indexOf("<ThemeScript />");
    const body = source.indexOf("<body");
    assert.ok(
      head !== -1 && script > head && body > script,
      `${file}: <ThemeScript /> must sit in <head> above <body>`,
    );
    assert.match(
      source,
      /suppressHydrationWarning/,
      `${file}: <html> needs suppressHydrationWarning, the script edits it before React runs`,
    );
  }
});

test("the script is a fixed string, so pages stay static and a CSP can allow it by hash", () => {
  const expected = `'sha256-${createHash("sha256").update(THEME_SCRIPT).digest("base64")}'`;
  assert.equal(THEME_SCRIPT_CSP_SOURCE, expected);
  assert.doesNotMatch(
    readFileSync(new URL("../../components/ui/ThemeScript.tsx", import.meta.url), "utf8"),
    /nonce|headers\(\)|cookies\(\)/,
  );
});
