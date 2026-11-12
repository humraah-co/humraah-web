// One search bar, with its Search button, on Universities, Explore and Scholarships.
// Run with: npm run test:unit
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { searchFormParts } from "./searchForm.ts";

const read = (path: string) => readFileSync(new URL(path, import.meta.url), "utf8");
const bar = read("../components/ui/SearchBar.tsx");
const pages = ["universities", "explore", "scholarships"].map((name) => ({
  name,
  source: read(`../app/[locale]/${name}/page.tsx`),
}));

test("all three pages use the shared bar and none builds its own search form", () => {
  for (const { name, source } of pages) {
    assert.match(source, /<SearchBar\s/, name);
    assert.ok(!source.includes('role="search"'), `${name} has its own search form`);
    assert.ok(!source.includes('name="q"'), `${name} has its own search box`);
  }
});

test("the bar is one GET form: the box and a submit button, so Enter and the button do the same", () => {
  assert.equal(bar.match(/<form\b/g)?.length, 1);
  assert.match(bar, /role="search"/);
  assert.match(bar, /name="q"/);
  assert.match(bar, /<button type="submit"/);
  assert.ok(!/onClick|onSubmit|onKeyDown/.test(bar), "no script: the browser submits the form");
});

test("the bar has a label, a localised address and the shared Search button text", () => {
  assert.match(bar, /<label htmlFor=\{id\} className="sr-only">/);
  assert.match(bar, /action=\{localizedPath\(path, locale\)\}/);
  assert.match(bar, /\{nav\("search"\)\}/);
});

test("the form keeps the applied filters and drops the old search words", () => {
  assert.deepEqual(searchFormParts("/explore"), { path: "/explore", fields: [] });
  assert.deepEqual(searchFormParts("/universities?q=old&city=Lahore&city=Karachi&women=1&sort=za"), {
    path: "/universities",
    fields: [
      ["city", "Lahore"],
      ["city", "Karachi"],
      ["women", "1"],
      ["sort", "za"],
    ],
  });
  assert.deepEqual(searchFormParts("/scholarships?scope=pakistan&type=merit").fields, [
    ["scope", "pakistan"],
    ["type", "merit"],
  ]);
});

test("each page passes its own address with the filters and no search words", () => {
  assert.match(pages[0].source, /<SearchBar[\s\S]*?href=\{hrefWith\(filters, \{ q: "" \}\)\}/);
  assert.match(pages[1].source, /<SearchBar[^>]*href="\/explore"/);
  assert.match(pages[2].source, /<SearchBar[\s\S]*?href=\{scholarshipsHref\(filters, \{ q: "" \}\)\}/);
});
