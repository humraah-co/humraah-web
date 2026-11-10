// The theme script must set data-theme on <html> before first paint, from
// the saved choice (Light when there is none, whatever the computer is set to;
// "system" follows the computer, live), and every root layout must put it in
// <head>, ahead of the body. Run with: npm run test:theme
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { runInNewContext } from "node:vm";
import { test } from "node:test";
import { THEME_SCRIPT_CSP_SOURCE } from "./hash.ts";
import {
  DEFAULT_CHOICE,
  parseChoice,
  resolveTheme,
  THEME_ATTRIBUTE,
  THEME_CHOICES,
  THEME_COLORS,
  THEME_SCRIPT,
  THEME_STORAGE_KEY,
} from "./script.ts";

type Env = {
  stored?: string | null;
  prefersDark?: boolean;
  storageThrows?: boolean;
  matchMediaThrows?: boolean;
};

/** Runs the script against a fake page. `computerChanges(dark)` fires the media query's change event, as when the computer's setting flips. */
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
  const state = { stored, dark: prefersDark };
  const listeners: (() => void)[] = [];
  const localStorage = {
    getItem(key: string) {
      if (storageThrows) throw new Error("blocked");
      assert.equal(key, THEME_STORAGE_KEY);
      return state.stored;
    },
  };
  const matchMedia = (query: string) => {
    if (matchMediaThrows) throw new Error("unsupported");
    assert.equal(query, "(prefers-color-scheme: dark)");
    return {
      get matches() {
        return state.dark;
      },
      addEventListener: (type: string, fn: () => void) => {
        assert.equal(type, "change");
        listeners.push(fn);
      },
    };
  };
  runInNewContext(THEME_SCRIPT, { document, localStorage, matchMedia });
  return {
    get theme() {
      return attributes[THEME_ATTRIBUTE];
    },
    get metas() {
      return metas.map((m) => m.content);
    },
    listeners: listeners.length,
    /** The computer's setting flips while the page is open. */
    computerChanges(dark: boolean) {
      state.dark = dark;
      listeners.forEach((fn) => fn());
    },
    /** The saved choice changes (the header control wrote it). */
    save(value: string) {
      state.stored = value;
    },
  };
}

test("the script is plain JavaScript that sets the attribute synchronously", () => {
  assert.equal(run({}).theme, "light");
  assert.doesNotMatch(THEME_SCRIPT, /async|await|setTimeout|DOMContentLoaded|requestAnimationFrame/);
});

test("the default is light, even when the computer is set to dark", () => {
  assert.equal(DEFAULT_CHOICE, "light");
  assert.equal(run({ prefersDark: true }).theme, "light");
  assert.equal(run({ prefersDark: false }).theme, "light");
  assert.equal(resolveTheme(null, true), "light");
  assert.equal(resolveTheme(undefined, true), "light");
});

test("a saved Light or Dark beats the computer's setting; System follows it", () => {
  assert.equal(run({ stored: "light", prefersDark: true }).theme, "light");
  assert.equal(run({ stored: "dark", prefersDark: false }).theme, "dark");
  assert.equal(run({ stored: "system", prefersDark: true }).theme, "dark");
  assert.equal(run({ stored: "system", prefersDark: false }).theme, "light");
});

test("a garbled saved value is the default, light, not the computer's setting", () => {
  assert.equal(run({ stored: "purple", prefersDark: true }).theme, "light");
  assert.equal(run({ stored: "", prefersDark: true }).theme, "light");
  assert.equal(run({ stored: "Dark", prefersDark: true }).theme, "light");
});

test("blocked storage gives light; a blocked or missing media query only matters for System", () => {
  assert.equal(run({ storageThrows: true, prefersDark: true }).theme, "light");
  assert.equal(run({ storageThrows: true, matchMediaThrows: true }).theme, "light");
  assert.equal(run({ stored: "dark", matchMediaThrows: true }).theme, "dark");
  assert.equal(run({ stored: "system", matchMediaThrows: true }).theme, "light");
});

test("with System the page follows the computer live, and only with System", () => {
  const page = run({ stored: "system", prefersDark: false });
  assert.equal(page.listeners, 1);
  assert.equal(page.theme, "light");
  page.computerChanges(true);
  assert.equal(page.theme, "dark");
  assert.deepEqual(page.metas, [THEME_COLORS.dark, THEME_COLORS.dark]);
  page.computerChanges(false);
  assert.equal(page.theme, "light");

  for (const choice of ["light", "dark"]) {
    const fixed = run({ stored: choice, prefersDark: false });
    fixed.computerChanges(true);
    assert.equal(fixed.theme, choice, `${choice} ignores the computer`);
  }
  // No saved choice: the computer is ignored too.
  const none = run({ prefersDark: false });
  none.computerChanges(true);
  assert.equal(none.theme, "light");
});

test("the script and resolveTheme give the same answer for every saved value and computer setting", () => {
  for (const stored of [null, "light", "dark", "system", "purple", ""]) {
    for (const prefersDark of [true, false]) {
      assert.equal(
        run({ stored, prefersDark }).theme,
        resolveTheme(stored, prefersDark),
        `${stored}/${prefersDark}`,
      );
    }
  }
});

test("earlier visitors keep their choice: the old saved values light and dark mean the same", () => {
  assert.equal(parseChoice("light"), "light");
  assert.equal(parseChoice("dark"), "dark");
  assert.deepEqual([...THEME_CHOICES], ["light", "dark", "system"]);
  assert.equal(parseChoice("system"), "system");
  assert.equal(parseChoice("auto"), "light");
});

test("the browser's theme-color follows the theme", () => {
  assert.deepEqual(run({ stored: "dark" }).metas, [THEME_COLORS.dark, THEME_COLORS.dark]);
  assert.deepEqual(run({ stored: "light" }).metas, [THEME_COLORS.light, THEME_COLORS.light]);
  assert.deepEqual(run({ prefersDark: true }).metas, [THEME_COLORS.light, THEME_COLORS.light]);
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
