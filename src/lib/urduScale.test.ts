// The Urdu type scale lives in one place in globals.css and never touches English.
// Run with: npm run test:unit
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const css = readFileSync(new URL("../app/globals.css", import.meta.url), "utf8").replaceAll("\r\n", "\n");
const urduRoot = css.slice(
  css.indexOf(":root:lang(ur) {"),
  css.indexOf("@layer utilities {\n  :root:lang(ur)"),
);

test("every size variable the type styles read is defined for Urdu pages and falls back to 1", () => {
  const used = [...css.matchAll(/calc\((\d+)px \* var\((--ur-[\w-]+), 1\)\)/g)];
  assert.ok(used.length >= 8);
  for (const [, px, name] of used) {
    const value = urduRoot.match(new RegExp(String.raw`${name}: ([\d.]+);`))?.[1];
    assert.ok(value, `${name} is defined for Urdu`);
    assert.ok(Number(value) <= 1, `${name} never makes Urdu bigger than English`);
    // Urdu body text stays at 16 px or more.
    if (name === "--ur-body-l") assert.ok(Number(px) * Number(value) >= 16);
  }
});

test("the English type styles keep their sizes", () => {
  for (const [name, size] of [
    ["display", "38px"],
    ["h1", "32px"],
    ["h2", "26px"],
    ["h3", "21px"],
    ["body-l", "17px"],
    ["script", "22px"],
  ]) {
    const block = css.slice(css.indexOf(`@utility text-${name} {`));
    assert.match(block.slice(0, 400), new RegExp(String.raw`calc\(${size} \* var\(--ur-[\w-]+, 1\)\)`), name);
  }
});

test("no new fonts for Urdu", () => {
  assert.match(css, /--font-urdu: var\(--font-nastaliq\), "Noto Nastaliq Urdu"/);
});
