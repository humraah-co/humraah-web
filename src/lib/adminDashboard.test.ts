// Dashboard: "Needs review" and "Recent activity" are a matched pair.
// Run with: npm run test:unit
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const read = (path: string) => readFileSync(new URL(path, import.meta.url), "utf8");
const page = read("../app/admin/(portal)/page.tsx");
const workspace = read("../components/admin/Workspace.tsx");
const panel = workspace.slice(workspace.indexOf("export function Panel"));
const pair = page.slice(page.indexOf('title="Needs review"') - 200);

test("both cards are Panels: the same radius, border and padding", () => {
  assert.equal(pair.match(/<Panel\b/g)?.length, 2);
  assert.match(pair, /<Panel\s+title="Needs review"/);
  assert.match(pair, /<Panel\s+title="Recent activity"/);
  assert.ok(!pair.includes("<section"), "no hand-made card beside the Panel");
});

test("side by side they share a top edge and stretch to the taller one; stacked below 1280 px", () => {
  assert.match(page, /<div className="flex flex-col gap-6 xl:flex-row xl:items-stretch">/);
  assert.ok(!pair.includes("xl:items-start"));
  assert.match(
    panel,
    /className=\{`flex flex-col overflow-hidden rounded-\[20px\] border border-border-soft bg-card/,
  );
});

test("the title rows have one fixed height, so the titles sit on one line", () => {
  assert.match(workspace, /const panelRow = "min-h-\[72px\] py-4 lg:min-h-20 lg:py-5";/);
  assert.match(panel, /<div className=\{`flex items-center gap-3 \$\{panelInset\} \$\{panelRow\}`\}>\s*<h2/);
});

test("both links sit in a footer on the bottom edge, not in the title row", () => {
  assert.match(
    panel,
    /mt-auto flex items-center border-t border-border-soft \$\{panelInset\} \$\{panelRow\}/,
  );
  assert.match(pair, /footer=\{\s*<Link href="\/admin\/review"[^>]*>\s*View all/);
  assert.match(pair, /footer=\{\s*<Link href="\/admin\/activity"[^>]*>\s*Open activity log/);
  assert.ok(!pair.includes("action="), "no link in either title row");
});
