// Scholarships: "Who offers it" (a Pakistani or an international provider) is the first filter group.
// Run with: npm run test:unit
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const read = (path: string) => readFileSync(new URL(path, import.meta.url), "utf8");
const groups = read("../components/scholarships/FilterGroups.tsx");
const page = read("../app/[locale]/scholarships/page.tsx");
const filters = read("./scholarshipFilters.ts");
const messages = (lang: string) => JSON.parse(read(`../messages/${lang}.json`));

const groupTitles = [...groups.matchAll(/<Group title=\{t\("(\w+)"\)\}>/g)].map((m) => m[1]);
const between = (source: string, from: string, to: string) =>
  source.slice(source.indexOf(from), source.indexOf(to, source.indexOf(from)));
const providerGroup = between(
  groups,
  '<Group title={t("filterProvider")}>',
  '<Group title={t("filterType")}>',
);
const typeGroup = between(groups, '<Group title={t("filterType")}>', "</Group>");

test("the filters start with who offers it, then type, field and good to know", () => {
  assert.deepEqual(groupTitles, ["filterProvider", "filterType", "filterField", "filterGoodToKnow"]);
});

test("who offers it uses the same chips as Type of support, with no All option", () => {
  for (const group of [providerGroup, typeGroup]) {
    assert.match(group, /<div className="flex flex-wrap gap-2">\s*\{/);
    assert.match(group, /<OptionChip\s/);
  }
  assert.ok(!groups.includes("Segmented"), "no segmented switch");
  assert.match(groups, /const providers = \["pakistan", "international"\] as const/);
  for (const lang of ["en", "ur"]) {
    const s = messages(lang).scholarships;
    assert.deepEqual(Object.keys(s.providers), ["pakistan", "international"], lang);
    assert.ok(!("scope" in s) && !("scopeLabel" in s), `${lang}: old switch strings removed`);
  }
});

test("one choice: a chip selects its provider, the other switches, the chosen one clears", () => {
  assert.match(
    providerGroup,
    /href=\{scholarshipsHref\(filters, \{ scope: filters\.scope === provider \? null : provider \}\)\}/,
  );
  assert.match(providerGroup, /selected=\{filters\.scope === provider\}/);
});

test("old links keep working: the provider stays in ?scope=", () => {
  assert.match(filters, /const scope = one\(raw\.scope\);/);
  assert.match(filters, /scope: scope === "pakistan" \|\| scope === "international" \? scope : null/);
  assert.match(filters, /if \(next\.scope\) params\.set\("scope", next\.scope\)/);
  assert.match(filters, /if \(f\.scope && s\.scope !== f\.scope\) return false;/);
});

test("it counts as an active filter, shows as a removable chip, and Clear all resets it", () => {
  assert.match(
    filters,
    /return \(f\.scope \? 1 : 0\) \+ f\.types\.length \+ \(f\.field \? 1 : 0\) \+ Number\(f\.women\);/,
  );
  assert.match(
    page,
    /const clearHref = scholarshipsHref\(filters, \{ scope: null, types: \[\], field: null, women: false \}\)/,
  );
  assert.match(
    page,
    /key: "scope",\s*label: t\(`providers\.\$\{filters\.scope\}`\),\s*href: scholarshipsHref\(filters, \{ scope: null \}\)/,
  );
});

test("the wording is about the provider, not where the student studies", () => {
  for (const source of [groups, filters])
    assert.ok(
      !/\bstudy\b|where you/i.test(source.replace(/not where the student studies|field of study/gi, "")),
    );
  assert.equal(messages("en").scholarships.filterProvider, "Who offers it");
  assert.ok(!("studyAbroad" in messages("en").scholarship));
  assert.match(
    read("./admin/content.ts"),
    /pakistan: "Pakistani provider",\s*international: "International provider"/,
  );
});

test("the same groups fill the desktop sidebar and the phone drawer; the top row is the search bar only", () => {
  assert.match(page, /const filterGroups = <ScholarshipFilterGroups /);
  assert.match(page, /<FilterSheet[\s\S]*?\{filterGroups\}[\s\S]*?<\/FilterSheet>/);
  assert.match(page, /<aside[\s\S]*?\{filterGroups\}[\s\S]*?<\/aside>/);
  const top = page.slice(page.indexOf("<h1"), page.indexOf("{cards && ("));
  assert.match(top, /<SearchBar\s/);
  assert.ok(!/lg:flex-row/.test(top));
});
