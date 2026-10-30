// Every class list in the components, checked in both themes: the text
// colour against the background actually behind it, in the default, hover,
// focus, selected (checked, aria-…) and disabled states. Fails below WCAG AA:
// 4.5:1 for text, 3:1 for large text and for borders that outline a control.
//
// There is no browser here, so this reads the source. Every string in
// src/**/*.tsx that holds a text-*, bg-* or border-* colour utility is a
// class list; `${name}` of a constant in the same file is filled in (that is
// how buttonStyles shares its base). A list is read like CSS would:
//   - text colour: the one it names, else (when it sets a font size but no
//     colour) the page's text colour, which it inherits;
//   - background: the one it names, else it's on the page, so every surface
//     a panel can have is tried, and the text must pass on all of them;
//   - a variant (hover:, focus:, checked:, aria-…:, group-…:) replaces the
//     text or background for that state only;
//   - responsive variants (lg:…) are alternatives, all of which are checked.
// So `text-ink` without a coral, sage or lavender fill fails in dark (dark
// text on the dark page), and so does a fill whose label is left to inherit
// the page's light text. Two different text colours in one list at the same
// state is a clash and fails too.
// Run with: npm run test:theme
import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { test } from "node:test";
import ts from "typescript";
import { contrast, themes } from "./tokens.ts";

const srcDir = fileURLToPath(new URL("../..", import.meta.url));

function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return sourceFiles(path);
    return /\.tsx$/.test(name) ? [path] : [];
  });
}

const tokenNames = Object.keys(themes.light);
const tokenPattern = [...tokenNames].sort((a, b) => b.length - a.length).join("|");
const utility = new RegExp(`^(text|bg|border)-(${tokenPattern})(?:/\\d+)?$`);
const typography =
  /^text-(display|h1|h2|h3|body-[lms]|label-(?:l|m|s|xs)|caption|script|\[\d+(?:\.\d+)?px\])$/;
const large = /^text-(display|h1|h2|h3)$/;
const responsive = /^(sm|md|lg|xl|2xl|max-.+|min-.+|rtl|ltr|motion-safe|motion-reduce|print)$/;

/** What a panel, card or the page itself can be behind text that sets no background of its own. */
const surfaces = ["cream", "card", "blush", "tint-coral", "tint-sage", "tint-lavender"];
/** The page's own text colour, which any text without a colour of its own inherits. */
const inherited = "charcoal";
/** Borders that outline a control by themselves. border-soft and -strong are dividers and card edges; the label inside names the control. */
const outlineBorders = new Set(["muted", "charcoal", "deep-rose"]);

type Parsed = { state: string; screen: string; kind: "text" | "bg" | "border"; token: string };

/** Splits a class on the colons outside [brackets]. */
function splitVariants(cls: string) {
  const parts: string[] = [];
  let depth = 0;
  let current = "";
  for (const ch of cls) {
    if (ch === "[") depth++;
    if (ch === "]") depth--;
    if (ch === ":" && depth === 0) {
      parts.push(current);
      current = "";
    } else current += ch;
  }
  return [...parts, current];
}

function parse(list: string[]) {
  const colours: Parsed[] = [];
  let hasTypography = false;
  let isLarge = false;
  for (const cls of list) {
    const variants = splitVariants(cls);
    const base = variants.pop()!;
    if (typography.test(base)) {
      hasTypography = true;
      if (large.test(base)) isLarge = true;
    }
    const m = utility.exec(base);
    // dark: utilities only run in dark and never set text or fill colours here.
    if (!m || variants.includes("dark")) continue;
    const state = variants.filter((v) => !responsive.test(v)).join(":");
    const screen = variants.filter((v) => responsive.test(v)).join(":");
    colours.push({ state, screen, kind: m[1] as Parsed["kind"], token: m[2] });
  }
  return { colours, hasTypography, isLarge };
}

type Problem = { where: string; list: string; theme: string; what: string };

function checkList(list: string[], where: string): Problem[] {
  const { colours, hasTypography, isLarge } = parse(list);
  if (colours.length === 0) return [];
  const problems: Problem[] = [];
  const pick = (kind: Parsed["kind"], state: string) =>
    colours.filter((c) => c.kind === kind && c.state === state).map((c) => c.token);
  const states = [...new Set(colours.map((c) => c.state))];
  const label = list.join(" ");

  // Two text colours at the same state and screen size: the one the browser uses depends on stylesheet order.
  for (const state of states) {
    for (const screen of new Set(colours.filter((c) => c.state === state).map((c) => c.screen))) {
      const clash = [
        ...new Set(
          colours
            .filter((c) => c.kind === "text" && c.state === state && c.screen === screen)
            .map((c) => c.token),
        ),
      ];
      if (clash.length > 1)
        problems.push({
          where,
          list: label,
          theme: "both",
          what: `${state || "default"}: clashing text colours ${clash.join(" and ")}`,
        });
    }
  }

  for (const [theme, tokens] of Object.entries(themes)) {
    for (const state of states) {
      // A state only replaces what it sets; the rest is the default's.
      const own = { text: pick("text", state), bg: pick("bg", state) };
      const texts = own.text.length ? own.text : pick("text", "");
      const bgs = own.bg.length ? own.bg : pick("bg", "");
      if (own.text.length || own.bg.length) {
        const foregrounds = texts.length ? texts : hasTypography && bgs.length ? [inherited] : [];
        const min = isLarge ? 3 : 4.5;
        for (const fg of foregrounds) {
          for (const back of bgs.length ? bgs : surfaces) {
            const ratio = contrast(tokens[fg], tokens[back]);
            if (ratio < min)
              problems.push({
                where,
                list: label,
                theme,
                what: `${state || "default"}: ${fg} text on ${back} is ${ratio.toFixed(2)}:1, needs ${min}:1${texts.length ? "" : " (it inherits the page's text colour)"}`,
              });
          }
        }
      }
      for (const edge of pick("border", state)) {
        if (!outlineBorders.has(edge)) continue;
        for (const back of bgs.length ? bgs : surfaces) {
          const ratio = contrast(tokens[edge], tokens[back]);
          if (ratio < 3)
            problems.push({
              where,
              list: label,
              theme,
              what: `${state || "default"}: ${edge} border on ${back} is ${ratio.toFixed(2)}:1, needs 3:1`,
            });
        }
      }
    }
  }
  return problems;
}

/** Every class list in a file, with the line it starts on. */
function classLists(file: string) {
  const text = readFileSync(file, "utf8");
  const source = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const constants = new Map<string, string>();
  const visitConstants = (node: ts.Node) => {
    if (
      ts.isVariableDeclaration(node) &&
      ts.isIdentifier(node.name) &&
      node.initializer &&
      (ts.isStringLiteral(node.initializer) || ts.isNoSubstitutionTemplateLiteral(node.initializer))
    )
      constants.set(node.name.text, node.initializer.text);
    ts.forEachChild(node, visitConstants);
  };
  visitConstants(source);

  const lists: { classes: string[]; line: number }[] = [];
  const add = (node: ts.Node, value: string) => {
    const classes = value.split(/\s+/).filter(Boolean);
    if (classes.some((c) => utility.test(splitVariants(c).pop()!)))
      lists.push({ classes, line: source.getLineAndCharacterOfPosition(node.getStart()).line + 1 });
  };
  const visit = (node: ts.Node) => {
    if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) add(node, node.text);
    else if (ts.isTemplateExpression(node)) {
      let value = node.head.text;
      for (const span of node.templateSpans) {
        const name = ts.isIdentifier(span.expression) ? span.expression.text : undefined;
        value += ` ${name ? (constants.get(name) ?? "") : ""} ${span.literal.text}`;
      }
      add(node, value);
    }
    ts.forEachChild(node, visit);
  };
  visit(source);
  return lists;
}

const files = sourceFiles(srcDir);
const lists = files.flatMap((file) =>
  classLists(file).map((l) => ({ ...l, where: `${relative(srcDir, file).replaceAll("\\", "/")}:${l.line}` })),
);

test("the scan reads the whole site, not a hand-picked list", () => {
  assert.ok(files.length > 100, `only ${files.length} component files found`);
  assert.ok(lists.length > 300, `only ${lists.length} class lists with colours found`);
  for (const dir of ["app/[locale]", "app/admin", "components/ui", "components/admin", "components/layout"])
    assert.ok(
      lists.some((l) => l.where.startsWith(dir)),
      `no class lists found under src/${dir}`,
    );
});

test("every class list with a colour passes WCAG AA in both themes, in every state it sets", () => {
  const problems = lists.flatMap((l) => checkList(l.classes, l.where));
  const report = problems.map((p) => `${p.where} [${p.theme}] ${p.what}\n      ${p.list}`);
  assert.deepEqual(report, []);
});

test("text-ink sits only on a coral, sage or lavender fill", () => {
  const fills = new Set(["coral", "sage", "lavender", "coral-hover", "sage-hover"]);
  const stray = lists
    .filter((l) => l.classes.includes("text-ink"))
    .filter((l) => !l.classes.some((c) => c.startsWith("bg-") && fills.has(c.slice(3))))
    .map((l) => `${l.where}: ${l.classes.join(" ")}`);
  assert.deepEqual(stray, []);
});
