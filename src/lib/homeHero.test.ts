// The home hero fills the first screen, so the next heading starts below the fold.
// Run with: npm run test:unit
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const read = (path: string) => readFileSync(new URL(path, import.meta.url), "utf8");
const css = read("../app/globals.css");
const home = read("../app/[locale]/page.tsx");
const hero = home.slice(home.indexOf("{/* Hero */}"), home.indexOf("{/* Path */}"));

test("the first-screen height is the small viewport minus the sticky header, with a vh fallback", () => {
  const rule = css.match(/@utility min-h-first-screen \{([^}]*)\}/)?.[1] ?? "";
  const heights = [...rule.matchAll(/min-height: calc\((100s?vh) - var\(--header-height\)\)/g)].map(
    (m) => m[1],
  );
  // The fallback comes first so browsers with svh use the second line.
  assert.deepEqual(heights, ["100vh", "100svh"]);
});

test("the header height is set for phones and from 1024 px", () => {
  assert.match(css, /:root \{[^}]*--header-height: 65px;/);
  assert.match(css, /@media \(min-width: 64rem\) \{\s*:root \{\s*--header-height: 81px;/);
});

test("the hero uses it as a minimum only, and centres its content", () => {
  assert.ok(hero.includes("min-h-first-screen"), "hero has the first-screen minimum");
  assert.ok(
    !/\bmax-h-|\bh-screen\b|\bh-dvh\b|\bh-svh\b/.test(hero),
    "no fixed or maximum height that could cut content",
  );
  assert.match(hero, /flex flex-1 flex-col justify-center/);
});

test("on tall screens the logo card grows a little, within limits", () => {
  assert.match(hero, /h-\[clamp\(440px,[^)]*svh,\s*540px\)\]/);
  assert.match(hero, /w-\[clamp\(520px,[^\]]*,600px\)\]/);
});
