// The header search: one search experience for the magnifier and the phone Menu.
// Run with: npm run test:unit
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { searchPath } from "./search.ts";

const read = (path: string) => readFileSync(new URL(path, import.meta.url), "utf8");
const component = read("../components/layout/HeaderSearch.tsx");

test("the magnifier is a labelled button that reports whether the box is open", () => {
  assert.match(component, /aria-label=\{t\("search"\)\}/);
  assert.match(component, /aria-expanded=\{open\}/);
  assert.match(component, /aria-controls=\{panelId\}/);
});

test("the box is named by aria-label, has no placeholder, and keeps a visible focus ring", () => {
  const box = component.slice(
    component.indexOf("<input"),
    component.indexOf("/>", component.indexOf("<input")),
  );
  assert.match(box, /aria-label=\{t\("searchLabel"\)\}/);
  assert.ok(!box.includes("placeholder"), "no placeholder text");
  assert.match(
    component,
    /focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-deep-rose/,
  );
});

test("its strings come from nav, which the client receives, not from the server-only search messages", () => {
  assert.ok(!component.includes('useTranslations("search")'));
  assert.match(component, /aria-label=\{t\("searchClose"\)\}/);
});

test("the box closes on Escape and outside clicks, and moves focus in and back", () => {
  assert.match(component, /event\.key === "Escape"/);
  assert.match(component, /addEventListener\("pointerdown"/);
  assert.match(component, /input\.current\?\.focus\(\)/);
  assert.match(component, /trigger\.current\?\.focus\(\)/);
});

test("Enter goes through the language-aware router to the cleaned search address; empty does nothing", () => {
  assert.match(component, /from "@\/i18n\/navigation"/);
  assert.match(component, /searchPath\(query\)/);
  assert.match(component, /if \(!path\)/);
  assert.equal(searchPath("   "), null);
  assert.equal(searchPath("scholarships"), "/search?q=scholarships");
});

test("the box does not animate for people who ask for less motion", () => {
  assert.match(component, /motion-safe:animate-/);
  assert.match(
    read("../app/globals.css"),
    /prefers-reduced-motion: no-preference\) \{\s*@keyframes search-open/,
  );
});

test("both headers and the phone Menu use the same search", () => {
  for (const file of ["../components/layout/SiteHeader.tsx", "../components/layout/MobileTopBar.tsx"]) {
    assert.ok(read(file).includes("<HeaderSearch />"), file);
  }
  const menu = read("../app/[locale]/menu/page.tsx");
  assert.match(menu, /href="\/search"/);
  assert.ok(!menu.includes("searchUniversities"));
});

test("the results page reads only the anon-key public loaders", () => {
  const data = read("./data/search.ts");
  assert.ok(data.includes('from "./public"'));
  assert.ok(!/service/i.test(data) && !/service/i.test(read("../app/[locale]/search/page.tsx")));
});
