// The Urdu review sheet: docs/urdu-review.csv, for a native speaker to check.
//
//   npm run urdu:export                       write docs/urdu-review.csv
//   npm run urdu:apply docs/urdu-review.csv   bring the reviewed Urdu back
//
// Columns: location, page, English, Urdu. Only the Urdu column is meant to
// be edited.
//
// - "ui:<message key>" rows are the site's own text (src/messages/ur.json).
// - "db:<table>/<row>/<column>" rows are content in the database. Their Urdu
//   comes from supabase/migrations/20261025000002_urdu_translations.sql and
//   any later *_urdu_review.sql migrations; their English from the seed.
//
// apply writes changed ui rows into src/messages/ur.json, and changed db
// rows into a new migration (supabase/migrations/<time>_urdu_review.sql) to
// run in Supabase like the others. It never writes to the database itself.
// A reviewed message must keep the English one's {placeholders} and <tags>,
// or apply refuses it and says which.
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(
  path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1")),
  "..",
);
const at = (...p) => path.join(root, ...p);
const MIGRATIONS = at("supabase", "migrations");
const MESSAGES_UR = at("src", "messages", "ur.json");
const DEFAULT_CSV = at("docs", "urdu-review.csv");

// ---------------------------------------------------------------------------
// CSV (RFC 4180: quoted cells may hold commas, quotes and line breaks)
// ---------------------------------------------------------------------------

const cell = (v) => (/[",\r\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);
const toCsv = (rows) => rows.map((r) => r.map((v) => cell(String(v ?? ""))).join(",")).join("\r\n") + "\r\n";

function parseCsv(text) {
  const rows = [];
  let row = [];
  let value = "";
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') ((value += '"'), i++);
      else if (c === '"') quoted = false;
      else value += c;
    } else if (c === '"') quoted = true;
    else if (c === ",") (row.push(value), (value = ""));
    else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      (row.push(value), rows.push(row), (row = []), (value = ""));
    } else value += c;
  }
  if (value || row.length) (row.push(value), rows.push(row));
  return rows.filter((r) => r.some((v) => v !== ""));
}

// ---------------------------------------------------------------------------
// Messages
// ---------------------------------------------------------------------------

function flatten(obj, prefix = "") {
  const out = new Map();
  for (const [k, v] of Object.entries(obj)) {
    if (v && typeof v === "object") for (const [kk, vv] of flatten(v, `${prefix}${k}.`)) out.set(kk, vv);
    else out.set(`${prefix}${k}`, String(v));
  }
  return out;
}

function setKey(obj, key, value) {
  const parts = key.split(".");
  let o = obj;
  for (const p of parts.slice(0, -1)) o = o[p];
  o[parts.at(-1)] = value;
}

const argumentsOf = (m) =>
  [
    ...new Set(
      [...m.matchAll(/\{(\w+)[,}]/g)]
        .map((x) => x[1])
        .concat([...m.matchAll(/<(\w+)>/g)].map((x) => `<${x[1]}>`)),
    ),
  ].sort();

// The English spells small counts as a word ({word}, "ten"); Urdu uses the number ({count}).
const countAsWord = new Set(["home.fieldsPhrase", "explore.intro"]);
const placeholders = (key, message) =>
  [...new Set(argumentsOf(message).map((a) => (countAsWord.has(key) && a === "word" ? "count" : a)))].join(
    " ",
  );

// The page a message appears on, by its first key part.
const pageOfNamespace = {
  layout: "every page",
  brand: "every page",
  nav: "every page (menus)",
  language: "every page (language switch)",
  footer: "every page (footer)",
  common: "many pages",
  badges: "many pages",
  blocks: "many pages",
  filters: "/universities, /scholarships",
  share: "detail pages",
  cards: "lists and cards",
  deadline: "scholarship cards",
  scholarshipKinds: "scholarships",
  contact: "/about (contact form)",
  privacyNotice: "/about, /privacy",
  quiz: "/quiz",
  universities: "/universities",
  scholarships: "/scholarships",
  home: "/",
  explore: "/explore",
  field: "/explore/[field]",
  university: "/universities/[university]",
  scholarship: "/scholarships/[scholarship]",
  guide: "/guide",
  guidance: "/guidance",
  resources: "/resources",
  about: "/about",
  privacy: "/privacy",
  menu: "/menu",
  notFound: "page not found",
};

// ---------------------------------------------------------------------------
// Database content
// ---------------------------------------------------------------------------

const KEY_COLUMN = {
  fields: "slug",
  universities: "slug",
  scholarships: "slug",
  resources: "url",
  guidance_articles: "slug",
};
const PAGE = {
  fields: (k) => `/explore/${k}`,
  universities: (k) => `/universities/${k}`,
  scholarships: (k) => `/scholarships/${k}`,
  resources: () => "/resources",
  guidance_articles: (k) => `/guidance/${k}`,
};

/** $ur$…$ur$ or array[$ur$…$ur$, …] → string or string[]. */
function readValue(sql) {
  const items = [...sql.matchAll(/\$ur\$([\s\S]*?)\$ur\$/g)].map((m) => m[1]);
  return sql.trim().startsWith("array[") ? items : items[0];
}

/** Every Urdu cell set by the translation and review migrations, the latest winning. */
function urduCells() {
  const files = fs
    .readdirSync(MIGRATIONS)
    .filter((f) => /_urdu_(translations|review)\.sql$/.test(f))
    .sort();
  const cells = new Map();
  const statement =
    /update public\.(\w+) set (\w+_ur) = (?:coalesce\(\2, ([\s\S]*?)\)|([\s\S]*?)) where (\w+) = '((?:[^']|'')*)';/g;
  for (const f of files) {
    const sql = fs.readFileSync(path.join(MIGRATIONS, f), "utf8");
    for (const m of sql.matchAll(statement)) {
      const [, table, column, coalesced, plain, , key] = m;
      cells.set(`${table}/${key.replace(/''/g, "'")}/${column}`, readValue(coalesced ?? plain));
    }
  }
  return cells;
}

/** The English of each cell, from the migrations and seed in an in-memory database. */
async function englishCells(cells) {
  const { PGlite } = await import("@electric-sql/pglite");
  const { citext } = await import("@electric-sql/pglite/contrib/citext");
  const db = new PGlite({ extensions: { citext } });
  await db.exec(`create schema extensions; create role anon nologin; create role authenticated nologin;
    create role service_role nologin bypassrls; create schema auth; create table auth.users (id uuid primary key, email text);
    create function auth.uid() returns uuid language sql stable as $$ select null::uuid $$;`);
  for (const f of fs.readdirSync(MIGRATIONS).sort())
    await db.exec(fs.readFileSync(path.join(MIGRATIONS, f), "utf8"));
  await db.exec(fs.readFileSync(at("supabase", "seed.sql"), "utf8"));
  const english = new Map();
  for (const location of cells.keys()) {
    const [table, key, column] = splitLocation(location);
    const col = column.replace(/_ur$/, "");
    const { rows } = await db.query(
      `select ${col} as v from public.${table} where ${KEY_COLUMN[table]} = $1`,
      [key],
    );
    english.set(location, rows[0]?.v ?? null);
  }
  await db.close();
  return english;
}

/** "resources/https://a.b/c/title_ur" → table, key (which may contain slashes), column. */
function splitLocation(location) {
  const first = location.indexOf("/");
  const last = location.lastIndexOf("/");
  return [location.slice(0, first), location.slice(first + 1, last), location.slice(last + 1)];
}

const asCell = (v) => (Array.isArray(v) ? v.join("\n") : (v ?? ""));
const asList = (text) =>
  text
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter(Boolean);

// ---------------------------------------------------------------------------
// Commands
// ---------------------------------------------------------------------------

async function exportSheet(file = DEFAULT_CSV) {
  const en = flatten(JSON.parse(fs.readFileSync(at("src", "messages", "en.json"), "utf8")));
  const ur = flatten(JSON.parse(fs.readFileSync(MESSAGES_UR, "utf8")));
  const rows = [["location", "page", "English", "Urdu"]];
  for (const [key, english] of en) {
    rows.push([`ui:${key}`, pageOfNamespace[key.split(".")[0]] ?? "", english, ur.get(key) ?? ""]);
  }
  const cells = urduCells();
  const english = await englishCells(cells);
  for (const [location, urdu] of cells) {
    const [table, key] = splitLocation(location);
    rows.push([`db:${location}`, PAGE[table](key), asCell(english.get(location)), asCell(urdu)]);
  }
  fs.mkdirSync(path.dirname(file), { recursive: true });
  // The byte-order mark makes Excel open the file as UTF-8, so the Urdu shows correctly.
  fs.writeFileSync(file, "﻿" + toCsv(rows));
  console.log(`Wrote ${path.relative(root, file)}: ${en.size} site texts and ${cells.size} database texts.`);
}

function applySheet(file) {
  if (!file) {
    console.error("Usage: npm run urdu:apply docs/urdu-review.csv");
    process.exit(1);
  }
  const text = fs.readFileSync(path.resolve(file), "utf8").replace(/^﻿/, "");
  const [header, ...rows] = parseCsv(text);
  const col = (name) => header.findIndex((h) => h.trim().toLowerCase() === name);
  const [iLoc, iUr] = [col("location"), col("urdu")];
  if (iLoc < 0 || iUr < 0) {
    console.error('The sheet needs "location" and "Urdu" columns, as exported by npm run urdu:export.');
    process.exit(1);
  }

  const urJson = JSON.parse(fs.readFileSync(MESSAGES_UR, "utf8"));
  const enFlat = flatten(JSON.parse(fs.readFileSync(at("src", "messages", "en.json"), "utf8")));
  const urFlat = flatten(urJson);
  const cells = urduCells();
  const uiChanged = [];
  const dbChanged = [];
  const problems = [];

  for (const r of rows) {
    const location = (r[iLoc] ?? "").trim();
    const urdu = (r[iUr] ?? "").replace(/\r\n/g, "\n").trim();
    if (location.startsWith("ui:")) {
      const key = location.slice(3);
      if (!enFlat.has(key)) problems.push(`${location}: no such message`);
      else if (!urdu) problems.push(`${location}: the Urdu is empty`);
      else if (urdu !== urFlat.get(key)) {
        const want = placeholders(key, enFlat.get(key));
        const got = placeholders(key, urdu);
        if (want !== got)
          problems.push(
            `${location}: use ${want || "no placeholders"} as in the English (it has ${got || "none"})`,
          );
        else uiChanged.push([key, urdu]);
      }
    } else if (location.startsWith("db:")) {
      const loc = location.slice(3);
      const [table, key, column] = splitLocation(loc);
      if (!KEY_COLUMN[table] || !/^\w+_ur$/.test(column)) {
        problems.push(`${location}: not a database text this sheet can change`);
        continue;
      }
      const before = asCell(cells.get(loc));
      if (urdu !== before.trim())
        dbChanged.push({ table, key, column, urdu, list: Array.isArray(cells.get(loc)) });
    } else if (location) problems.push(`${location}: unknown location`);
  }

  if (problems.length) {
    console.error(`Nothing was changed. Fix these rows first:\n  ${problems.join("\n  ")}`);
    process.exit(1);
  }

  for (const [key, urdu] of uiChanged) setKey(urJson, key, urdu);
  if (uiChanged.length) fs.writeFileSync(MESSAGES_UR, JSON.stringify(urJson, null, 2) + "\n");

  let migration = null;
  if (dbChanged.length) {
    const stamp = new Date().toISOString().replace(/\D/g, "").slice(0, 14);
    migration = path.join(MIGRATIONS, `${stamp}_urdu_review.sql`);
    const lit = (v) => {
      if (v.includes("$ur$")) throw new Error("Urdu text can't contain $ur$");
      return `$ur$${v}$ur$`;
    };
    const lines = [
      `-- Urdu corrections from the review sheet (${path.basename(file)}), made with npm run urdu:apply.`,
      "-- Run it in Supabase like the other migrations. Safe to run again.",
      "",
      ...dbChanged.map(({ table, key, column, urdu, list }) => {
        const value = !urdu ? "null" : list ? `array[${asList(urdu).map(lit).join(", ")}]` : lit(urdu);
        return `update public.${table} set ${column} = ${value} where ${KEY_COLUMN[table]} = '${key.replace(/'/g, "''")}';`;
      }),
      "",
    ];
    fs.writeFileSync(migration, lines.join("\n"));
  }

  console.log(`Site texts changed: ${uiChanged.length}${uiChanged.length ? ` (src/messages/ur.json)` : ""}`);
  for (const [key] of uiChanged) console.log(`  ui:${key}`);
  console.log(
    `Database texts changed: ${dbChanged.length}${migration ? ` (${path.relative(root, migration)})` : ""}`,
  );
  for (const c of dbChanged) console.log(`  db:${c.table}/${c.key}/${c.column}`);
  if (migration)
    console.log("Run the new migration in Supabase (SQL editor or supabase db push) to publish them.");
}

const [command, file] = process.argv.slice(2);
if (command === "export") await exportSheet(file ? path.resolve(file) : undefined);
else if (command === "apply") applySheet(file);
else {
  console.error("Usage: node scripts/urdu-review.mjs export [file] | apply <file>");
  process.exit(1);
}
