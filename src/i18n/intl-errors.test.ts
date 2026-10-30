// No next-intl errors on any public page, in English or Urdu.
//
// 1. Every message with placeholders ({min}) or tags (<email></email>) is
//    read with its values. Checked in the source with the TypeScript
//    compiler, so a call like t("feeRange") fails here, not in the browser.
// 2. Every page renders without next-intl logging an error. A dev server is
//    started against a fake Supabase that serves the fixture rows below (a
//    university with a fee range, one with no fee, one with only a minimum
//    and one with only a maximum, and so on), and every page is fetched in
//    both languages.
//
// Run with: npm run test:i18n
import assert from "node:assert/strict";
import { spawn, spawnSync } from "node:child_process";
import fs from "node:fs";
import http from "node:http";
import net from "node:net";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const root = fileURLToPath(new URL("../..", import.meta.url));

// ---------------------------------------------------------------------------
// Messages
// ---------------------------------------------------------------------------

const load = (lang: string) =>
  JSON.parse(fs.readFileSync(path.join(root, `src/messages/${lang}.json`), "utf8")) as Record<
    string,
    unknown
  >;

function flatten(obj: Record<string, unknown>, prefix = ""): Map<string, string> {
  const out = new Map<string, string>();
  for (const [key, value] of Object.entries(obj)) {
    if (value && typeof value === "object") {
      for (const [k, v] of flatten(value as Record<string, unknown>, `${prefix}${key}.`)) out.set(k, v);
    } else out.set(`${prefix}${key}`, String(value));
  }
  return out;
}

const en = flatten(load("en"));
const ur = flatten(load("ur"));

/** Placeholder and tag names a message needs values for. */
function argumentsOf(message: string) {
  const names = new Set<string>();
  for (const m of message.matchAll(/\{(\w+)[,}]/g)) names.add(m[1]);
  for (const m of message.matchAll(/<(\w+)>/g)) names.add(m[1]);
  return names;
}

/** Each key's arguments in either language (they should match; messages.test.ts checks that). */
const needs = new Map<string, Set<string>>();
for (const messages of [en, ur]) {
  for (const [key, message] of messages) {
    const names = argumentsOf(message);
    if (names.size) needs.set(key, new Set([...(needs.get(key) ?? []), ...names]));
  }
}

// ---------------------------------------------------------------------------
// 1. Placeholders are always given values
// ---------------------------------------------------------------------------

type Problem = string;

/**
 * Translator types such as QuizT, by the namespace their comment names:
 * `/** The "quiz" messages, from useTranslations("quiz") … *\/`.
 */
function translatorTypes(files: readonly ts.SourceFile[]) {
  const types = new Map<string, string>();
  for (const sf of files) {
    for (const node of sf.statements) {
      if (!ts.isTypeAliasDeclaration(node)) continue;
      const comments = ts.getLeadingCommentRanges(sf.text, node.getFullStart()) ?? [];
      for (const c of comments) {
        const match = /The "([\w.]+)" messages/.exec(sf.text.slice(c.pos, c.end));
        if (match) types.set(node.name.text, match[1]);
      }
    }
  }
  return types;
}

/** The namespace of `useTranslations("ns")`, `await getTranslations({ locale, namespace: "ns" })` and so on. */
function namespaceOf(expr: ts.Expression): string | undefined {
  const call = ts.isAwaitExpression(expr) ? expr.expression : expr;
  if (!ts.isCallExpression(call) || !ts.isIdentifier(call.expression)) return undefined;
  if (call.expression.text !== "useTranslations" && call.expression.text !== "getTranslations")
    return undefined;
  const [arg] = call.arguments;
  if (!arg) return "";
  if (ts.isStringLiteralLike(arg)) return arg.text;
  if (ts.isObjectLiteralExpression(arg)) {
    for (const p of arg.properties) {
      if (
        ts.isPropertyAssignment(p) &&
        p.name.getText() === "namespace" &&
        ts.isStringLiteralLike(p.initializer)
      )
        return p.initializer.text;
    }
    return "";
  }
  return undefined;
}

const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/**
 * Translator calls in one file whose message needs values that aren't given,
 * or whose message doesn't exist. `keysOfType` turns a non-literal key
 * (`t(u.type)`) into the strings its type allows, when it can.
 */
function findProblems(
  sf: ts.SourceFile,
  types: Map<string, string>,
  keysOfType: (key: ts.Expression) => string[] | undefined = () => undefined,
): Problem[] {
  const problems: Problem[] = [];
  const scopes: Map<string, string>[] = [new Map()];
  const lookup = (name: string) => scopes.findLast((s) => s.has(name))?.get(name);
  const where = (node: ts.Node) =>
    `${path.relative(root, sf.fileName).replaceAll("\\", "/")}:${sf.getLineAndCharacterOfPosition(node.getStart()).line + 1}`;

  function check(call: ts.CallExpression, namespace: string) {
    const [keyArg, values] = call.arguments;
    if (!keyArg) return;
    const prefix = namespace ? `${namespace}.` : "";
    let keys: string[];
    if (ts.isStringLiteralLike(keyArg)) {
      keys = [prefix + keyArg.text];
      if (!en.has(keys[0])) problems.push(`${where(call)} reads "${keys[0]}", which isn't in en.json`);
    } else if (ts.isTemplateExpression(keyArg)) {
      let pattern = escapeRegExp(keyArg.head.text);
      for (const span of keyArg.templateSpans) pattern += `[^.]+${escapeRegExp(span.literal.text)}`;
      const re = new RegExp(`^${escapeRegExp(prefix)}${pattern}$`);
      keys = [...en.keys()].filter((k) => re.test(k));
      if (!keys.length)
        problems.push(`${where(call)} reads ${prefix}${keyArg.getText()}, which matches nothing in en.json`);
    } else {
      const literals = keysOfType(keyArg);
      if (!literals) {
        problems.push(
          `${where(call)} reads a key (${keyArg.getText()}) whose possible values can't be told from its type`,
        );
        return;
      }
      keys = literals.map((k) => prefix + k);
    }

    let given: Set<string> | "any" = new Set();
    if (values && !ts.isObjectLiteralExpression(values)) given = "any";
    else if (values && ts.isObjectLiteralExpression(values)) {
      if (values.properties.some(ts.isSpreadAssignment)) given = "any";
      else
        for (const p of values.properties)
          if (p.name) given.add(p.name.getText().replace(/^["']|["']$/g, ""));
    }
    for (const key of keys) {
      const missing = [...(needs.get(key) ?? [])].filter((n) => given !== "any" && !given.has(n));
      if (missing.length)
        problems.push(`${where(call)} reads "${key}" without ${missing.map((n) => `{${n}}`).join(", ")}`);
    }
  }

  function visit(node: ts.Node) {
    const scoped = ts.isFunctionLike(node) || ts.isBlock(node) || ts.isSourceFile(node);
    if (scoped) scopes.push(new Map());
    if (ts.isFunctionLike(node)) {
      for (const p of node.parameters) {
        const type = p.type && ts.isTypeReferenceNode(p.type) ? p.type.typeName.getText() : undefined;
        if (ts.isIdentifier(p.name) && type && types.has(type))
          scopes.at(-1)!.set(p.name.text, types.get(type)!);
      }
    }
    if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name) && node.initializer) {
      const namespace = namespaceOf(node.initializer);
      if (namespace !== undefined) scopes.at(-1)!.set(node.name.text, namespace);
    }
    if (ts.isCallExpression(node)) {
      const callee = node.expression;
      const name = ts.isIdentifier(callee)
        ? callee.text
        : ts.isPropertyAccessExpression(callee) &&
            ts.isIdentifier(callee.expression) &&
            (callee.name.text === "rich" || callee.name.text === "markup")
          ? callee.expression.text
          : undefined;
      const namespace = name === undefined ? undefined : lookup(name);
      if (namespace !== undefined) check(node, namespace);
      // A translator handed straight to a function, as in deadlineLabel(s, useTranslations("deadline"), …),
      // is checked where that function's typed parameter uses it.
    }
    ts.forEachChild(node, visit);
    if (scoped) scopes.pop();
  }
  visit(sf);
  return problems;
}

test("the check catches a message with placeholders read without values", () => {
  const sf = ts.createSourceFile(
    "example.tsx",
    `export default async function Page() {
       const t = await getTranslations("university");
       const fee = formatFeeRange(1, 2, t("feeRange"));
       const ok = t("feeRange", { min: "a", max: "b" });
       const half = t("feeRange", { min: "a" });
       return t("noSuchMessage");
     }`,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX,
  );
  assert.deepEqual(findProblems(sf, new Map()), [
    `${path.relative(root, "example.tsx").replaceAll("\\", "/")}:3 reads "university.feeRange" without {min}, {max}`,
    `${path.relative(root, "example.tsx").replaceAll("\\", "/")}:5 reads "university.feeRange" without {max}`,
    `${path.relative(root, "example.tsx").replaceAll("\\", "/")}:6 reads "university.noSuchMessage", which isn't in en.json`,
  ]);
});

test("every message with placeholders is read with its values", () => {
  const config = ts.readConfigFile(path.join(root, "tsconfig.json"), ts.sys.readFile);
  const parsed = ts.parseJsonConfigFileContent(config.config, ts.sys, root);
  const src = path.join(root, "src").replaceAll("\\", "/");
  const fileNames = parsed.fileNames.filter((f) => f.startsWith(src) && !/\.test\.tsx?$/.test(f));
  const program = ts.createProgram(fileNames, { ...parsed.options, noEmit: true, incremental: false });
  const checker = program.getTypeChecker();
  const files = program.getSourceFiles().filter((sf) => fileNames.includes(sf.fileName));
  const types = translatorTypes(files);
  assert.ok(types.has("QuizT") && types.has("DeadlineT"), "translator types not found");

  const keysOfType = (key: ts.Expression) => {
    const type = checker.getTypeAtLocation(key);
    const parts = type.isUnion() ? type.types : [type];
    return parts.every((t) => t.isStringLiteral())
      ? parts.map((t) => (t as ts.StringLiteralType).value)
      : undefined;
  };
  assert.deepEqual(
    files.flatMap((sf) => findProblems(sf, types, keysOfType)),
    [],
  );
});

// ---------------------------------------------------------------------------
// 2. Every page renders without a next-intl error
// ---------------------------------------------------------------------------

const audited = {
  status: "published",
  source_url: "https://example.edu.pk",
  created_by: null,
  updated_by: null,
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
};
const daysFromNow = (days: number) => new Date(Date.now() + days * 86_400_000).toISOString().slice(0, 10);
const recently = new Date(Date.now() - 7 * 86_400_000).toISOString();
const longAgo = "2025-01-15T00:00:00Z";

const field = (id: string, slug: string, name: string, sort_order: number, urdu: boolean) => ({
  ...audited,
  last_verified_at: recently,
  id,
  slug,
  name,
  emoji: null,
  summary: `${name} summary`,
  you_might_enjoy: "solving problems and working with people",
  interests: ["Problem solving"],
  example_programmes: [`BS ${name}`],
  sort_order,
  name_ur: urdu ? `${name} (اردو)` : null,
  summary_ur: urdu ? "خلاصہ" : null,
  you_might_enjoy_ur: urdu ? "مسائل حل کرنا" : null,
  interests_ur: urdu ? ["مسائل حل کرنا"] : null,
  example_programmes_ur: null,
});

const university = (
  id: string,
  slug: string,
  fee_min_pkr: number | null,
  fee_max_pkr: number | null,
  extra: Record<string, unknown> = {},
) => ({
  ...audited,
  last_verified_at: recently,
  id,
  slug,
  name: `${slug} University`,
  short_name: null,
  city: "Lahore",
  campuses_note: null,
  province: "Punjab",
  type: "public",
  hec_recognised: true,
  women_only: false,
  has_hostel: true,
  website_url: "https://example.edu.pk",
  admissions_url: "https://example.edu.pk/admissions",
  overview: "An overview.",
  how_to_apply: null,
  required_documents: [],
  fee_min_pkr,
  fee_max_pkr,
  fee_note: null,
  admissions_window: null,
  need_based_aid: null,
  admission_test: null,
  name_ur: null,
  campuses_note_ur: null,
  overview_ur: null,
  how_to_apply_ur: null,
  required_documents_ur: null,
  fee_note_ur: null,
  admissions_window_ur: null,
  admission_test_ur: null,
  ...extra,
});

const scholarship = (
  id: string,
  slug: string,
  deadline: string | null,
  extra: Record<string, unknown> = {},
) => ({
  ...audited,
  last_verified_at: recently,
  id,
  slug,
  name: `${slug} Scholarship`,
  provider: "HEC",
  scope: "pakistan",
  kind: "merit",
  summary: "A summary.",
  who_its_for: null,
  what_it_covers: null,
  eligible_areas: [],
  women_only: false,
  how_to_apply: null,
  deadline,
  deadline_note: null,
  official_url: "https://example.org",
  covers: [],
  audience_note: null,
  summary_ur: null,
  who_its_for_ur: null,
  what_it_covers_ur: null,
  how_to_apply_ur: null,
  audience_note_ur: null,
  deadline_note_ur: null,
  covers_ur: null,
  eligible_areas_ur: null,
  ...extra,
});

const fixtures: Record<string, Record<string, unknown>[]> = {
  fields: [
    field("f1", "engineering", "Engineering", 1, true),
    field("f2", "medicine-health", "Medicine and Health", 2, false),
    field("f3", "natural-applied-sciences", "Natural and Applied Sciences", 3, true),
    field("f4", "business-management", "Business and Management", 4, false),
  ],
  universities: [
    university("u1", "fee-range", 45000, 60000, {
      short_name: "FRU",
      campuses_note: "Main campus and city campus",
      campuses_note_ur: "مرکزی اور شہر کیمپس",
      overview_ur: "جائزہ",
      how_to_apply: "1. Check you are eligible\n2. Register online\n3. Pay the fee",
      required_documents: ["CNIC or B-Form", "Matric certificate"],
      fee_note: "Per semester",
      admissions_window: "June to August",
      need_based_aid: true,
      admission_test: "Entry test",
    }),
    university("u2", "no-fee", null, null, { type: null, has_hostel: null, last_verified_at: longAgo }),
    university("u3", "min-only", 30000, null, { type: "private", women_only: true, need_based_aid: false }),
    university("u4", "max-only", null, 80000, { last_verified_at: null }),
  ],
  programmes: [
    {
      id: "p1",
      university_id: "u1",
      field_id: "f1",
      name: "BS Electrical Engineering",
      level: "Undergraduate",
      duration_years: 4,
      entry_requirements: "FSc Pre-Engineering, 60%",
      entry_test: "ECAT",
      entry_requirements_ur: "ایف ایس سی پری انجینئرنگ، 60%",
      entry_test_ur: null,
      sort_order: 1,
      created_at: audited.created_at,
      updated_at: audited.updated_at,
    },
    {
      id: "p2",
      university_id: "u1",
      field_id: "f2",
      name: "MBBS",
      level: "Undergraduate",
      duration_years: 5,
      entry_requirements: null,
      entry_test: "MDCAT",
      entry_requirements_ur: null,
      entry_test_ur: null,
      sort_order: 2,
      created_at: audited.created_at,
      updated_at: audited.updated_at,
    },
    {
      id: "p3",
      university_id: "u2",
      field_id: null,
      name: "BS Something Else",
      level: "Undergraduate",
      duration_years: 4,
      entry_requirements: null,
      entry_test: null,
      entry_requirements_ur: null,
      entry_test_ur: null,
      sort_order: 1,
      created_at: audited.created_at,
      updated_at: audited.updated_at,
    },
  ],
  scholarships: [
    scholarship("s1", "open", daysFromNow(60), {
      kind: "need",
      covers: ["Tuition", "Stipend"],
      covers_ur: ["فیس", "وظیفہ"],
      eligible_areas: ["Punjab"],
      who_its_for: "Students from low-income families",
      how_to_apply: "1. Apply online\n2. Send documents",
      audience_note: "For girls in Punjab",
    }),
    scholarship("s2", "closing-soon", daysFromNow(10), { scope: "international", kind: "external" }),
    scholarship("s3", "closed", daysFromNow(-5), { kind: "government", last_verified_at: longAgo }),
    scholarship("s4", "no-deadline", null, { deadline_note: "Usually opens in March", official_url: null }),
  ],
  scholarship_fields: [
    { scholarship_id: "s1", field_id: "f1" },
    { scholarship_id: "s2", field_id: "f3" },
  ],
  guidance_articles: [
    {
      ...audited,
      last_verified_at: recently,
      id: "g1",
      slug: "choosing-a-field",
      title: "Choosing a field",
      summary: "How to choose.",
      body_markdown: "## First\n\nSome words to read.\n\n- One\n- Two",
      sort_order: 1,
      title_ur: "شعبہ کیسے چنیں",
      summary_ur: null,
      body_markdown_ur: null,
    },
  ],
  resources: [
    {
      ...audited,
      last_verified_at: recently,
      id: "r1",
      title: "HEC",
      description: "Higher Education Commission",
      url: "https://hec.gov.pk",
      category: "official",
      sort_order: 1,
      title_ur: null,
      description_ur: "ہائر ایجوکیشن کمیشن",
    },
    {
      ...audited,
      last_verified_at: recently,
      id: "r2",
      title: "Test prep",
      description: null,
      url: "https://example.org/tests",
      category: "tests",
      sort_order: 2,
      title_ur: null,
      description_ur: null,
    },
  ],
};

/** Enough of PostgREST for the public pages: select, eq filters and order. */
function fakeSupabase() {
  return http.createServer((req, res) => {
    const url = new URL(req.url ?? "/", "http://localhost");
    const table = /^\/rest\/v1\/(\w+)$/.exec(url.pathname)?.[1];
    const rows = table ? fixtures[table] : undefined;
    if (!rows) {
      res.writeHead(404, { "content-type": "application/json" });
      res.end(JSON.stringify({ message: `no fixture for ${url.pathname}` }));
      return;
    }
    let out = rows.filter((row) =>
      [...url.searchParams].every(([key, value]) =>
        ["select", "order", "limit", "offset"].includes(key) || !value.startsWith("eq.")
          ? true
          : String(row[key]) === value.slice(3),
      ),
    );
    const columns = (url.searchParams.get("select") ?? "*").split(",").map((c) => c.trim());
    if (!columns.includes("*"))
      out = out.map((row) => Object.fromEntries(columns.map((c) => [c, row[c] ?? null])));
    res.writeHead(200, { "content-type": "application/json" });
    res.end(JSON.stringify(out));
  });
}

const freePort = () =>
  new Promise<number>((resolve, reject) => {
    const server = net.createServer();
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const { port } = server.address() as net.AddressInfo;
      server.close(() => resolve(port));
    });
  });

/** Every public page, with the data each kind of message depends on. */
const pages: { path: string; status?: number; contains?: Record<"en" | "ur", string> }[] = [
  { path: "/" },
  { path: "/about" },
  { path: "/privacy" },
  { path: "/menu" },
  { path: "/guide" },
  { path: "/explore" },
  { path: "/explore?q=engineer" },
  { path: "/explore?q=zzz" },
  { path: "/explore/engineering" },
  { path: "/explore/medicine-health" },
  { path: "/quiz" },
  { path: "/quiz?step=2&q1=science&q1=technology" },
  { path: "/quiz/results" },
  { path: "/quiz/results?q1=science&q1=technology&q2=maths&q3=helping" },
  { path: "/universities" },
  { path: "/universities?q=fee&sort=za" },
  { path: "/universities?q=zzz" },
  {
    path: "/universities/fee-range",
    contains: { en: "Rs 45,000 to Rs 60,000", ur: "Rs 45,000 سے Rs 60,000" },
  },
  {
    path: "/universities/no-fee",
    contains: { en: en.get("university.noFees")!, ur: ur.get("university.noFees")! },
  },
  { path: "/universities/min-only", contains: { en: "Rs 30,000", ur: "Rs 30,000" } },
  { path: "/universities/max-only", contains: { en: "Rs 80,000", ur: "Rs 80,000" } },
  { path: "/universities/missing", status: 404 },
  { path: "/scholarships" },
  { path: "/scholarships?q=open&sort=az" },
  { path: "/scholarships?q=zzz" },
  { path: "/scholarships/open" },
  { path: "/scholarships/closing-soon" },
  { path: "/scholarships/closed" },
  { path: "/scholarships/no-deadline" },
  { path: "/guidance" },
  { path: "/guidance/choosing-a-field" },
  { path: "/resources" },
];

/** What next-intl logs: "IntlError: FORMATTING_ERROR: …" and the other codes. */
const intlError =
  /IntlError|\b(?:MISSING_MESSAGE|MISSING_FORMAT|ENVIRONMENT_FALLBACK|INSUFFICIENT_PATH|INVALID_MESSAGE|INVALID_KEY|FORMATTING_ERROR)\b/;

const decode = (html: string) =>
  html
    .replace(/<!-- -->/g, "")
    .replace(/&#x27;|&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&");

test(
  "every page renders in English and Urdu without a next-intl error",
  { timeout: 15 * 60_000 },
  async () => {
    const supabase = fakeSupabase();
    await new Promise<void>((resolve) => supabase.listen(0, "127.0.0.1", resolve));
    const supabasePort = (supabase.address() as net.AddressInfo).port;
    const port = await freePort();

    // Its own build folder, so a running `npm run dev` is left alone. Its data
    // cache would otherwise serve the last run's fixtures; clear it.
    const distDir = path.join(".next", "intl-test");
    fs.rmSync(path.join(root, distDir, "cache", "fetch-cache"), { recursive: true, force: true });
    // Next adds the folder's types to these two files; put them back afterwards.
    const restore = ["tsconfig.json", "next-env.d.ts"].map((file) => {
      const full = path.join(root, file);
      const before = fs.existsSync(full) ? fs.readFileSync(full) : undefined;
      return () => (before === undefined ? fs.rmSync(full, { force: true }) : fs.writeFileSync(full, before));
    });

    let output = "";
    const server = spawn(
      process.execPath,
      [path.join(root, "node_modules/next/dist/bin/next"), "dev", "--port", String(port)],
      {
        cwd: root,
        detached: process.platform !== "win32",
        env: {
          ...process.env,
          NEXT_DIST_DIR: distDir,
          NEXT_TELEMETRY_DISABLED: "1",
          NEXT_PUBLIC_SUPABASE_URL: `http://127.0.0.1:${supabasePort}`,
          NEXT_PUBLIC_SUPABASE_ANON_KEY: "test-anon-key",
          SUPABASE_SERVICE_ROLE_KEY: "",
          NEXT_PUBLIC_URDU_ENABLED: "true",
        },
      },
    );
    server.stdout.on("data", (chunk) => (output += chunk));
    server.stderr.on("data", (chunk) => (output += chunk));

    try {
      const deadline = Date.now() + 120_000;
      while (!/Ready in/.test(output)) {
        assert.ok(server.exitCode === null, `next dev exited:\n${output}`);
        assert.ok(Date.now() < deadline, `next dev didn't start:\n${output}`);
        await new Promise((resolve) => setTimeout(resolve, 250));
      }

      const failures: string[] = [];
      for (const locale of ["en", "ur"] as const) {
        for (const page of pages) {
          const address = locale === "ur" ? (page.path === "/" ? "/ur" : `/ur${page.path}`) : page.path;
          const before = output.length;
          const res = await fetch(`http://127.0.0.1:${port}${address}`, {
            headers: { "accept-language": locale, cookie: `NEXT_LOCALE=${locale}` },
            signal: AbortSignal.timeout(180_000),
          });
          const html = decode(await res.text());
          // Give the server a moment to finish writing anything it logged for this page.
          await new Promise((resolve) => setTimeout(resolve, 100));
          const logged = output.slice(before);
          if (res.status !== (page.status ?? 200)) failures.push(`${address}: status ${res.status}`);
          if (intlError.test(logged))
            failures.push(`${address}: next-intl logged an error:\n${logged.trim()}`);
          const expected = page.contains?.[locale];
          if (expected && !html.includes(expected)) failures.push(`${address}: doesn't show "${expected}"`);
        }
      }
      assert.deepEqual(failures, []);
      assert.doesNotMatch(output, intlError);
    } finally {
      if (process.platform === "win32") spawnSync("taskkill", ["/pid", String(server.pid), "/t", "/f"]);
      else if (server.pid) process.kill(-server.pid, "SIGTERM");
      await new Promise((resolve) => supabase.close(resolve));
      for (const undo of restore) undo();
    }
  },
);
