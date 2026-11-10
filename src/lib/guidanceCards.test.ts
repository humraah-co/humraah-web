// Every card list on the Guidance page comes from the shared CardGrid, so the
// columns, gaps and edges match across the Guide, Articles and Resources.
// Run with: npm run test:unit
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const read = (path: string) => readFileSync(new URL(path, import.meta.url), "utf8").replaceAll("\r\n", "\n");
const sections = ["Guide", "Articles", "Resources"].map((name) => ({
  name,
  source: read(`../components/guidance/${name}Section.tsx`),
}));
const grid = read("../components/layout/CardGrid.tsx");

test("each Guidance section renders its cards through CardGrid and has no grid of its own", () => {
  for (const { name, source } of sections) {
    assert.match(source, /import \{ CardGrid \} from "@\/components\/layout\/CardGrid"/, name);
    assert.ok(source.includes("<CardGrid"), name);
    assert.ok(!/<(ul|ol)\b/.test(source), `${name} builds no list of its own`);
    assert.ok(!/className=[^\n]*\bgrid\b/.test(source), `${name} sets no grid classes`);
  }
});

test("CardGrid is one column, then two from 768px, with one gap, and never three unless asked", () => {
  assert.match(grid, /grid-cols-1 gap-3\.5 md:grid-cols-2 lg:gap-6/);
  for (const { name, source } of sections) {
    assert.ok(!/\bwide\b/.test(source), `${name} does not opt into three columns`);
    assert.ok(!/grid-cols-3/.test(source), name);
  }
});

test("What's inside, the PDF cards, articles, resources and the help note share the card tokens", () => {
  const styles = read("../components/ui/cardStyles.ts");
  assert.match(styles, /rounded-\[20px\] border border-border-soft p-4 lg:p-5/);
  for (const file of [
    "../components/guidance/GuideSection.tsx",
    "../components/guidance/ArticlesSection.tsx",
    "../components/content/Cards.tsx",
    "../components/ui/Blocks.tsx",
  ]) {
    const source = read(file);
    assert.ok(source.includes("cardStyles.shape"), file);
    assert.ok(
      !/rounded-\[20px\] border border-border-soft/.test(source),
      `${file} has no private card shape`,
    );
  }
});
