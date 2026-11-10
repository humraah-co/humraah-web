// Guardrails for the card grids: cards in a row share a height, the footer
// is pinned to the bottom and text is clamped, so the rows line up.
// Reads the source (there is no browser here). Run with: npm run test:unit
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const read = (path: string) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
const cards = read("components/content/Cards.tsx");
const grid = read("components/layout/CardGrid.tsx");

test("the list pages use a real grid, not independent columns", () => {
  assert.match(grid, /grid grid-cols-1/);
  assert.match(grid, /md:grid-cols-2/);
  for (const page of ["explore", "universities", "scholarships"]) {
    const source = read(`app/[locale]/${page}/page.tsx`);
    assert.match(source, /<CardGrid/, page);
    assert.doesNotMatch(source, /TwoColumns/, page);
  }
});

test("every card fills its grid cell and pins its footer to the bottom", () => {
  assert.match(cards, /const card = `group flex h-full w-full min-w-0 flex-col/);
  assert.match(cards, /mt-auto flex flex-col gap-3/);
  // The three grid cards and the resource card all use the shared pieces.
  assert.equal((cards.match(/<CardBottom>/g) ?? []).length >= 3, true);
});

test("titles and descriptions both clamp to two lines, with no reserved height", () => {
  const styles = read("components/ui/cardStyles.ts");
  assert.match(styles, /title: "line-clamp-2 text-label-l"/);
  assert.match(styles, /description: "line-clamp-2 text-body-s text-muted"/);
  assert.doesNotMatch(styles + cards, /min-h-\[2lh\]/);
  // Meta lines sit right under the description, never pushed to the foot (no mt-auto).
  assert.match(styles, /meta: "mt-1"/);
  const articles = read("components/guidance/ArticlesSection.tsx");
  assert.doesNotMatch(articles, /mt-auto|self-stretch/);
});

test("tag and chip rows are limited to a fixed number of lines", () => {
  assert.match(read("components/ui/Chip.tsx"), /max-h-7 overflow-hidden/);
  assert.match(cards, /<ChipList lines=\{[12]\}/);
});

test("hover only changes the border, with no movement or shadow", () => {
  // The shared card tokens carry the hover rule; the cards use them.
  assert.match(read("components/ui/cardStyles.ts"), /hover:border-border-strong/);
  assert.match(cards, /cardStyles.hover/);
  assert.doesNotMatch(read("components/ui/cardStyles.ts"), /translate|shadow|animate-/);
  assert.doesNotMatch(cards, /translate|shadow-raised|animate-/);
});
