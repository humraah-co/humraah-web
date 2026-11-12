// Scholarships: the All / Pakistan / International switch is the first filter group.
// Run with: npm run test:unit
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const read = (path: string) => readFileSync(new URL(path, import.meta.url), "utf8");
const groups = read("../components/scholarships/FilterGroups.tsx");
const page = read("../app/[locale]/scholarships/page.tsx");
const filters = read("./scholarshipFilters.ts");

const groupTitles = [...groups.matchAll(/<Group title=\{t\("(\w+)"\)\}>/g)].map((m) => m[1]);

test("the filters start with where you'll study, then type, field and good to know", () => {
  assert.deepEqual(groupTitles, ["scopeLabel", "filterType", "filterField", "filterGoodToKnow"]);
});

test("the audience group is a segmented switch over All, Pakistan and International, kept in ?scope=", () => {
  const first = groups.slice(
    groups.indexOf('<Group title={t("scopeLabel")}>'),
    groups.indexOf('<Group title={t("filterType")}>'),
  );
  assert.match(first, /<Segmented\s/);
  assert.match(first, /href: scholarshipsHref\(filters, \{ scope: o\.scope \}\)/);
  assert.match(first, /selected: filters\.scope === o\.scope/);
  assert.match(groups, /\{ key: "all", scope: null \}/);
  assert.match(groups, /\{ key: "pakistan", scope: "pakistan" \}/);
  assert.match(groups, /\{ key: "international", scope: "international" \}/);
  assert.match(filters, /if \(next\.scope\) params\.set\("scope", next\.scope\)/);
});

test("the same groups fill the desktop sidebar and the phone drawer", () => {
  assert.match(page, /const filterGroups = <ScholarshipFilterGroups /);
  assert.match(page, /<FilterSheet[\s\S]*?\{filterGroups\}[\s\S]*?<\/FilterSheet>/);
  assert.match(page, /<aside[\s\S]*?\{filterGroups\}[\s\S]*?<\/aside>/);
});

test("the top row holds only the search bar, as on Universities", () => {
  assert.ok(!page.includes("<Segmented"), "no switch beside the search bar");
  const top = page.slice(page.indexOf("<h1"), page.indexOf("{cards && ("));
  assert.match(top, /<SearchBar\s/);
  assert.ok(!/lg:flex-row/.test(top));
});

test("Clear all and the filter count work as before; a chip shows the chosen audience", () => {
  assert.match(
    page,
    /const clearHref = scholarshipsHref\(filters, \{ types: \[\], field: null, women: false \}\)/,
  );
  assert.match(filters, /return f\.types\.length \+ \(f\.field \? 1 : 0\) \+ Number\(f\.women\);/);
  assert.match(
    page,
    /key: "scope",\s*label: t\(`scope\.\$\{filters\.scope\}`\),\s*href: scholarshipsHref\(filters, \{ scope: null \}\)/,
  );
});
