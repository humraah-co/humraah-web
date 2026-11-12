// Segmented controls share one corner shape: the outline is concentric with the options inside.
// Run with: npm run test:unit
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const read = (path: string) => readFileSync(new URL(path, import.meta.url), "utf8");
const css = read("../app/globals.css");

const users = [
  "../components/ui/ThemeToggle.tsx",
  "../components/layout/LanguageSwitch.tsx",
  "../components/layout/NotificationsBell.tsx",
  "../components/ui/Segmented.tsx",
  "../components/admin/EditorParts.tsx",
  "../components/admin/AdminNav.tsx",
];

test("the option radius and the gap round it are set once, in globals.css", () => {
  assert.match(css, /:root \{[^}]*--segment-radius: 18px;[^}]*--segment-pad: 4px;/);
});

test("the outline's corner is the option's plus the padding plus the 1 px border", () => {
  assert.match(
    css,
    /@utility segment-group \{\s*border-radius: calc\(var\(--segment-radius\) \+ var\(--segment-pad\) \+ 1px\);\s*\}/,
  );
  assert.match(css, /@utility segment-option \{\s*border-radius: var\(--segment-radius\);\s*\}/);
});

test("every group has the shared padding and a 1 px border, and its options the shared corner", () => {
  let groups = 0;
  for (const file of users) {
    const source = read(file);
    // One class list per match: a "…" string or a one-line `…` template.
    const classLists = source.match(/"[^"\n]*segment-group[^"\n]*"|`[^`\n]*segment-group[^`\n]*`/g) ?? [];
    assert.ok(classLists.length > 0, `${file} uses segment-group`);
    for (const list of classLists) {
      groups++;
      assert.match(list, /\bborder\b/, `${file}: ${list}`);
      assert.match(list, /\bp-\(--segment-pad\)/, `${file}: ${list}`);
      assert.ok(!/\brounded-|\bp-\d/.test(list), `${file} sets its own corner or padding: ${list}`);
    }
    assert.match(source, /\bsegment-option\b/, `${file} options use the shared corner`);
  }
  // Theme row and theme panel, Menu language switch, deadlines row, Pakistan/International,
  // workspace choices, and the workspace sidebar's account box.
  assert.equal(groups, 7);
});

test("the Menu language options fill the group's height, so the gap is even in Urdu too", () => {
  assert.match(read("../components/layout/LanguageSwitch.tsx"), /"flex items-stretch gap-1 segment-group/);
});

test("the workspace sidebar's theme and account boxes match: sidebar colour, soft border, shared corner", () => {
  const nav = read("../components/admin/AdminNav.tsx");
  const theme = read("../components/ui/ThemeToggle.tsx");
  const box = /"[^"\n]*\bsegment-group\b[^"\n]*\bborder-border-soft\b[^"\n]*\bbg-card\b[^"\n]*"/;
  assert.match(nav, /<aside className="[^"]*\bbg-card\b/);
  const user = nav.slice(nav.indexOf("const user ="), nav.indexOf("const brand ="));
  assert.match(user, box);
  assert.match(theme.slice(theme.indexOf("function ThemeRow")), box);
  assert.ok(!user.includes("bg-cream"), "no cream account box");
});
