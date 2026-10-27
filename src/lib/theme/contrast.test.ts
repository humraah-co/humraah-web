// WCAG contrast of the colour pairs the site uses, in the light and the dark
// theme. The colours are read from src/app/globals.css (the @theme block for
// light, :root[data-theme="dark"] for dark), so a token edited there is
// checked here. Fails if any pair drops below AA.
// Run with: npm run test:theme
import assert from "node:assert/strict";
import { test } from "node:test";
import { contrast, dark, darkOverrides, light, luminance, themes } from "./tokens.ts";

const surfaces = ["cream", "card", "blush", "tint-coral", "tint-sage", "tint-lavender"];
const fills = ["coral", "sage", "lavender", "coral-hover", "sage-hover"];

/** [foreground, background, minimum ratio, what it is]. 4.5 for text, 3 for icons, borders of form fields and focus rings. */
const pairs: [string, string, number, string][] = [
  // Text on every surface a panel, card or page can have.
  ...["charcoal", "muted", "deep-rose", "deep-sage"].flatMap((text) =>
    surfaces.map((surface): [string, string, number, string] => [text, surface, 4.5, "text"]),
  ),
  // Button and badge labels on the coral, sage and lavender fills (their hover shades too).
  ...fills.map((fill): [string, string, number, string] => ["ink", fill, 4.5, "label on a fill"]),
  // Form fields and checkboxes are outlined in `muted`; the focus ring is deep-rose.
  ...["cream", "card", "blush"].flatMap((surface): [string, string, number, string][] => [
    ["muted", surface, 3, "form field border"],
    ["deep-rose", surface, 3, "focus ring"],
  ]),
  ["deep-rose", "tint-coral", 3, "checked box and its tick"],
];

for (const [theme, tokens] of Object.entries(themes)) {
  test(`every colour pair is WCAG AA in the ${theme} theme`, () => {
    const failures: string[] = [];
    for (const [fg, bg, min, what] of pairs) {
      assert.ok(tokens[fg], `--color-${fg} is not defined`);
      assert.ok(tokens[bg], `--color-${bg} is not defined`);
      const ratio = contrast(tokens[fg], tokens[bg]);
      if (ratio < min) failures.push(`${what}: ${fg} on ${bg} is ${ratio.toFixed(2)}:1, needs ${min}:1`);
    }
    assert.deepEqual(failures, []);
  });
}

test("the dark theme defines every colour the light theme does", () => {
  const darkOnly = darkOverrides;
  assert.deepEqual(
    Object.keys(light).filter((name) => !(name in darkOnly)),
    [],
    "a light token with no dark value would stay light on the dark page",
  );
});

test("the dark theme has no pure black surface or pure white text", () => {
  const forbidden = new Set(["#000000", "#ffffff"]);
  const used = Object.entries(darkOverrides).filter(([, hex]) => forbidden.has(hex));
  assert.deepEqual(used, []);
});

test("the dark theme's page and text stay gentle: not too bright, not too stark", () => {
  // Text brighter than ~14:1 on the page is the harsh glare this theme avoids.
  assert.ok(contrast(dark.charcoal, dark.cream) < 15, "charcoal on cream is too stark");
  assert.ok(luminance(dark.cream) > 0.005, "the page is close to pure black");
});
