// The English and Urdu message files must match: same keys, and the same
// placeholders ({name}) and tags (<email></email>) in every message.
// Run with: npm run test:i18n
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

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
