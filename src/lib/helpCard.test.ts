// The Guidance page's help note is the last cell of the shared article grid.
// Run with: npm run test:unit
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const read = (path: string) => readFileSync(new URL(path, import.meta.url), "utf8");
const section = read("../components/guidance/ArticlesSection.tsx");

test("the articles use the shared card grid, with the help card as its last item", () => {
  assert.match(section, /import \{ CardGrid \} from "@\/components\/layout\/CardGrid"/);
  assert.ok(!/<ul[^>]*grid/.test(section), "no private grid");
  const items = section.slice(section.indexOf("items={["), section.indexOf("]}\n"));
  const lastKey = [...items.matchAll(/key: ("help"|a\.id)/g)].pop()?.[1];
  assert.equal(lastKey, '"help"');
  assert.equal(items.match(/key: "help"/g)?.length, 1);
  // Placed by the grid itself: no spacer or fixed position.
  assert.ok(!/col-start|row-start|[ "]order-d/.test(section));
});

test("the help card is not a link as a whole; only the Instagram handle and email are", () => {
  const blocks = read("../components/ui/Blocks.tsx");
  const help = blocks.slice(
    blocks.indexOf("export function HelpCallout"),
    blocks.indexOf("export function NextSteps") > 0 ? blocks.indexOf("Next steps") : undefined,
  );
  assert.match(help, /<aside/);
  assert.match(help, /card\s*\?/);
  assert.match(help, /rel="noopener"/);
  assert.ok(!/<Link/.test(help));
});
