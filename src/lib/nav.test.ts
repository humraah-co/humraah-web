// The site navigation after the Guide and Resources pages became part of
// Guidance and the mobile bottom bar was removed. Run with: npm run test:unit
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { test } from "node:test";
import { desktopNav, footerExplore, footerHelp, isActive, menuNav } from "./nav.ts";

const hrefs = (items: { href: string }[]) => items.map((i) => i.href);

test("one Guidance link replaces Guidance, Guide and Resources in the header and footer", () => {
  for (const items of [desktopNav, footerHelp, menuNav]) {
    assert.deepEqual(
      hrefs(items).filter((h) => ["/guidance", "/guide", "/resources"].includes(h)),
      ["/guidance"],
    );
  }
});

test("the phone menu has every destination the bottom bar had", () => {
  for (const href of ["/", "/explore", "/universities", "/scholarships", "/guidance"]) {
    assert.ok(hrefs(menuNav).includes(href), href);
  }
});

test("every navigation link points at a page that exists", () => {
  const pages = new URL("../app/[locale]", import.meta.url);
  for (const href of new Set([
    ...hrefs(desktopNav),
    ...hrefs(footerExplore),
    ...hrefs(footerHelp),
    ...hrefs(menuNav),
  ])) {
    const folder = href === "/" ? "" : href.slice(1);
    assert.ok(existsSync(new URL(`./${folder ? `${folder}/` : ""}page.tsx`, `${pages.href}/`)), href);
  }
});

test("the bottom navigation bar is gone", () => {
  assert.equal(existsSync(new URL("../components/layout/BottomNav.tsx", import.meta.url)), false);
});

test("Guidance stays highlighted on an article page, in both languages", () => {
  assert.equal(isActive("/guidance/choosing-a-field", "/guidance"), true);
  assert.equal(isActive("/ur/guidance", "/guidance"), true);
  assert.equal(isActive("/guide", "/guidance"), false);
});

test("the top bar has no Where do I start button, but the home page still does", () => {
  const read = (path: string) => readFileSync(new URL(path, import.meta.url), "utf8");
  for (const file of ["../components/layout/SiteHeader.tsx", "../components/layout/MobileTopBar.tsx"]) {
    const source = read(file);
    assert.ok(!source.includes("whereToStart"), file);
    assert.ok(!source.includes('"/quiz"'), file);
  }
  const home = read("../app/[locale]/page.tsx");
  assert.ok(home.includes('href="/quiz"') && home.includes('t("heroStart")'));
  // Footer and phone menu keep their own link to the quiz.
  assert.ok(footerExplore.some((i) => i.href === "/quiz"));
  assert.ok(menuNav.some((i) => i.href === "/quiz"));
});
