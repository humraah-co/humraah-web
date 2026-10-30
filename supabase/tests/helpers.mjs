// Shared set-up for the access-rule tests: an in-memory Postgres (PGlite)
// with Supabase-like roles and auth.uid(), every migration and the seed
// applied, one user per role, and as() to run a query as a role.
import { PGlite } from "@electric-sql/pglite";
import { citext } from "@electric-sql/pglite/contrib/citext";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

export const users = {
  OWNER: "00000000-0000-0000-0000-0000000000a1",
  ADMIN: "00000000-0000-0000-0000-0000000000a2",
  RESEARCHER: "00000000-0000-0000-0000-0000000000a3",
  SUSPENDED: "00000000-0000-0000-0000-0000000000a4",
  OUTSIDER: "00000000-0000-0000-0000-0000000000a5",
};

export async function setup() {
  const db = new PGlite({ extensions: { citext } });
  await db.exec(`
    create schema extensions;
    create role anon nologin; create role authenticated nologin; create role service_role nologin bypassrls;
    create schema auth;
    create table auth.users (id uuid primary key, email text);
    create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
    grant usage on schema auth to anon, authenticated;
    grant execute on function auth.uid() to anon, authenticated;
  `);
  for (const f of fs.readdirSync(repo + "/migrations").sort()) {
    await db.exec(fs.readFileSync(`${repo}/migrations/${f}`, "utf8"));
  }
  await db.exec(fs.readFileSync(repo + "/seed.sql", "utf8"));
  const { OWNER, ADMIN, RESEARCHER, SUSPENDED, OUTSIDER } = users;
  await db.exec(`insert into auth.users values ('${OWNER}','o@x'),('${ADMIN}','a@x'),('${RESEARCHER}','r@x'),('${SUSPENDED}','s@x'),('${OUTSIDER}','x@x');
    insert into team_members (user_id,email,role,status) values
      ('${OWNER}','o@x','owner','active'),('${ADMIN}','a@x','admin','active'),
      ('${RESEARCHER}','r@x','researcher','active'),('${SUSPENDED}','s@x','researcher','suspended');`);

  /** Runs one query as a role (and signed-in user). Rows, or "ERROR: message" when it is refused. */
  async function as(role, uid, sql) {
    try {
      await db.exec("begin");
      await db.exec(
        `set local role ${role}; select set_config('request.jwt.claim.sub', '${uid || ""}', true);`,
      );
      const r = await db.query(sql);
      await db.exec("commit");
      return r.rows;
    } catch (e) {
      await db.exec("rollback");
      return "ERROR: " + e.message;
    }
  }

  let failed = 0;
  const check = (name, got, want) => {
    const ok = JSON.stringify(got) === JSON.stringify(want);
    if (!ok) failed++;
    console.log(ok ? "PASS" : "FAIL", name, ok ? "" : JSON.stringify(got));
  };
  const refused = (got, text) => typeof got === "string" && got.includes(text);
  const finish = (label) => {
    if (failed) {
      console.error(`${failed} check(s) failed`);
      process.exit(1);
    }
    console.log(`All ${label} checks passed`);
  };
  const json = (values) => `'${JSON.stringify(values).replace(/'/g, "''")}'::jsonb`;
  return { db, as, check, refused, finish, json, ...users };
}
