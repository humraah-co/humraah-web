// The English and Urdu message files must match: same keys, and the same
// placeholders ({name}) and tags (<email></email>) in every message.
// Run with: npm run test:i18n
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

const load = (lang: string) =>
  JSON.parse(readFileSync(new URL(`../messages/${lang}.json`, import.meta.url), "utf8")) as Record<
    string,
    unknown
  >;

function flatten(obj: Record<string, unknown>, prefix = ""): Map<string, string> {
  const out = new Map<string, string>();
  for (const [key, value] of Object.entries(obj)) {
    if (value && typeof value === "object") {
      for (const [k, v] of flatten(value as Record<string, unknown>, `${prefix}${key}.`)) out.set(k, v);
    } else out.set(`${prefix}${key}`, String(value));
  }
  return out;
}

/** Placeholder and tag names a message uses. Plural branches may word the count differently, so "#" is ignored. */
function argumentsOf(message: string) {
  const names = new Set<string>();
  for (const m of message.matchAll(/\{(\w+)[,}]/g)) names.add(m[1]);
  for (const m of message.matchAll(/<(\w+)>/g)) names.add(`<${m[1]}>`);
  return [...names].sort();
}

// The English sentence spells small counts as words ({word}, "ten"); Urdu uses the number ({count}).
const countAsWord = new Set(["home.fieldsPhrase", "explore.intro"]);

const en = flatten(load("en"));
const ur = flatten(load("ur"));

test("ur.json has exactly the keys of en.json", () => {
  assert.deepEqual(
    [...en.keys()].filter((k) => !ur.has(k)),
    [],
    "missing in ur.json",
  );
  assert.deepEqual(
    [...ur.keys()].filter((k) => !en.has(k)),
    [],
    "only in ur.json",
  );
});

test("every Urdu message uses the same placeholders and tags as the English", () => {
  const different = [...en.keys()]
    .filter((k) => !countAsWord.has(k) && ur.has(k))
    .filter((k) => argumentsOf(en.get(k)!).join() !== argumentsOf(ur.get(k)!).join());
  assert.deepEqual(different, []);
});

test("no Urdu message is left empty or in English", () => {
  const urduLetters = /[؀-ۿ]/;
  // Messages that are only a placeholder, a format or a brand label are the same in both languages.
  const sameInBoth = new Set([
    "layout.titleTemplate",
    "guide.pdf",
    "universities.chipQuery",
    "scholarships.chipQuery",
    "university.feeRange",
  ]);
  const untranslated = [...ur.entries()]
    .filter(([k, v]) => !sameInBoth.has(k) && !urduLetters.test(v))
    .map(([k]) => k);
  assert.deepEqual(untranslated, []);
});

// A client component only gets the namespaces the layout ships to it
// (CLIENT_NAMESPACES in messages.ts). Reading any other namespace shows the
// raw key ("search.placeholder") in the browser instead of the text.
test("client components read only the namespaces the client receives", () => {
  const src = fileURLToPath(new URL("..", import.meta.url));
  const shipped = readFileSync(new URL("./messages.ts", import.meta.url), "utf8")
    .match(/CLIENT_NAMESPACES = \[([\s\S]*?)\]/)![1]
    .match(/"(\w+)"/g)!
    .map((name) => name.slice(1, -1));
  const files = readdirSync(src, { recursive: true, encoding: "utf8" }).filter((f) => f.endsWith(".tsx"));
  let checked = 0;
  for (const file of files) {
    const source = readFileSync(path.join(src, file), "utf8");
    if (!/^["']use client["']/m.test(source)) continue;
    for (const [, namespace] of source.matchAll(/useTranslations\("(\w+)"\)/g)) {
      checked++;
      assert.ok(
        shipped.includes(namespace),
        `${file} reads "${namespace}", which the client does not receive`,
      );
    }
  }
  assert.ok(checked > 5, "found the client components");
});
