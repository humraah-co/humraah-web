// Re-run test: applies every migration and the seed to a fresh in-memory
// Postgres (PGlite), then applies the Day 4 and later migrations again. It
// passes only if the second run has no errors and leaves the schema exactly
// as it was, so a migration that fails halfway in Supabase can be run again.
// Run with: npm run test:db
import { PGlite } from "@electric-sql/pglite";
import { citext } from "@electric-sql/pglite/contrib/citext";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const db = new PGlite({ extensions: { citext } });
// Supabase-like scaffolding, as in access-rules.test.mjs.
await db.exec(`
  create schema extensions;
  create role anon nologin; create role authenticated nologin; create role service_role nologin bypassrls;
  create schema auth;
  create table auth.users (id uuid primary key, email text);
  create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
  grant usage on schema auth to anon, authenticated;
  grant execute on function auth.uid() to anon, authenticated;
`);

const migrations = fs.readdirSync(repo + "/migrations").sort();
// Day 4 (23 October 2026) onwards must be safe to run again.
const repeatable = migrations.filter((f) => f >= "20261023");
const sql = (f) => fs.readFileSync(`${repo}/migrations/${f}`, "utf8");

for (const f of migrations) await db.exec(sql(f));
await db.exec(fs.readFileSync(repo + "/seed.sql", "utf8"));

/** Everything a migration can define in the public schema, as comparable text. */
async function snapshot() {
  const rows = async (q) => (await db.query(q)).rows;
  return JSON.stringify({
    functions:
      await rows(`select p.proname, pg_get_function_identity_arguments(p.oid) args, pg_get_functiondef(p.oid) def, p.proacl::text acl
      from pg_proc p join pg_namespace n on n.oid = p.pronamespace where n.nspname = 'public' order by 1, 2`),
    triggers: await rows(`select tgrelid::regclass::text tbl, tgname, pg_get_triggerdef(oid) def
      from pg_trigger where not tgisinternal order by 1, 2`),
    indexes: await rows(
      `select tablename, indexname, indexdef from pg_indexes where schemaname = 'public' order by 1, 2`,
    ),
    policies: await rows(
      `select tablename, policyname, cmd, roles::text, qual, with_check from pg_policies where schemaname = 'public' order by 1, 2`,
    ),
    defaults: await rows(`select table_name, column_name, column_default from information_schema.columns
      where table_schema = 'public' order by 1, 2`),
  });
}

let failed = 0;
const check = (name, ok, detail = "") => {
  if (!ok) failed++;
  console.log(ok ? "PASS" : "FAIL", name, ok ? "" : detail);
};
async function run(f) {
  try {
    await db.exec(sql(f));
    return null;
  } catch (e) {
    return e.message;
  }
}

const before = await snapshot();
check("there are Day 4 and later migrations to re-run", repeatable.length > 0);

// 1. Everything from Day 4 on, again, in order.
for (const f of repeatable) {
  const error = await run(f);
  check(`second run of ${f} has no errors`, !error, error ?? "");
}
check("re-running them in order leaves the schema exactly as it was", (await snapshot()) === before);

// 2. Each file twice in a row, as when one is run again by hand after a failure.
for (const f of repeatable) {
  const first = await run(f);
  const second = await run(f);
  check(`${f} can be run twice in a row`, !first && !second, first ?? second ?? "");
}
// Re-running an older file on its own brings back the function versions it
// defines, so running everything again in order restores the final state.
for (const f of repeatable) await run(f);
check("running them all in order again restores the final schema", (await snapshot()) === before);

if (failed) {
  console.error(`${failed} check(s) failed`);
  process.exit(1);
}
console.log("All re-run checks passed");
