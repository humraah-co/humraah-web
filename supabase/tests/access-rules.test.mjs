// Access-rule tests: applies every migration and the seed to an in-memory
// Postgres (PGlite), then checks what each role can and cannot do.
// Run with: npm run test:db
import { PGlite } from "@electric-sql/pglite";
import { citext } from "@electric-sql/pglite/contrib/citext";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const db = new PGlite({ extensions: { citext } });
// Supabase-like scaffolding: roles, auth schema, auth.uid() from a session setting.
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
const q = async (sql) => (await db.query(sql)).rows;
console.log(
  await q(
    `select (select count(*) from fields) f, (select count(*) from universities) u, (select count(*) from programmes) p, (select count(*) from scholarships) s, (select count(*) from scholarship_fields) sf, (select count(*) from resources) r, (select count(*) from guidance_articles) g, (select count(*) from activity_log) log`,
  ),
);

// Users
const OWNER = "00000000-0000-0000-0000-000000000001",
  ADMIN = "00000000-0000-0000-0000-000000000002",
  RES = "00000000-0000-0000-0000-000000000003",
  SUS = "00000000-0000-0000-0000-000000000004";
await db.exec(`insert into auth.users values ('${OWNER}','o@x'),('${ADMIN}','a@x'),('${RES}','r@x'),('${SUS}','s@x');
 insert into team_members (user_id,email,role,status) values ('${OWNER}','o@x','owner','active'),('${ADMIN}','a@x','admin','active'),('${RES}','r@x','researcher','active'),('${SUS}','s@x','researcher','suspended');
 update universities set status='draft' where slug='aku';`);

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
check(
  "anon sees only published universities",
  await as("anon", null, `select count(*)::int n from universities`),
  [{ n: 10 }],
);
check(
  "anon cannot see draft AKU programmes",
  await as(
    "anon",
    null,
    `select count(*)::int n from programmes p join universities u on u.id=p.university_id where u.slug='aku'`,
  ),
  [{ n: 0 }],
);
check(
  "anon cannot insert university",
  typeof (await as("anon", null, `insert into universities (slug,name,city) values ('x','X','Y')`)),
  "string",
);
check(
  "anon can send contact message",
  await as("anon", null, `insert into contact_messages (name,email,message) values ('a','a@b.c','hi')`),
  [],
);
check(
  "anon cannot read contact messages",
  typeof (await as("anon", null, `select * from contact_messages`)),
  "string",
);
check("anon cannot read team", typeof (await as("anon", null, `select * from team_members`)), "string");
check("researcher sees drafts", await as("authenticated", RES, `select count(*)::int n from universities`), [
  { n: 11 },
]);
check(
  "researcher publishes",
  await as(
    "authenticated",
    RES,
    `update universities set status='published' where slug='aku' returning status`,
  ),
  [{ status: "published" }],
);
check(
  "researcher archives",
  await as(
    "authenticated",
    RES,
    `update universities set status='archived' where slug='aku' returning status`,
  ),
  [{ status: "archived" }],
);
const r1 = await as(
  "authenticated",
  RES,
  `update universities set status='draft' where slug='aku' returning status`,
);
check("researcher cannot restore", String(r1).includes("Only admins can restore"), true);
check(
  "researcher delete removes nothing",
  await as("authenticated", RES, `delete from universities where slug='aku' returning slug`),
  [],
);
check(
  "admin restores",
  await as(
    "authenticated",
    ADMIN,
    `update universities set status='draft' where slug='aku' returning status`,
  ),
  [{ status: "draft" }],
);
check(
  "suspended member sees only published",
  await as("authenticated", SUS, `select count(*)::int n from universities`),
  [{ n: 10 }],
);
check(
  "suspended member cannot edit",
  await as("authenticated", SUS, `update universities set name='z' where slug='qau' returning slug`),
  [],
);
const r2 = await as(
  "authenticated",
  ADMIN,
  `insert into team_members (user_id,email,role,status) values ('${SUS}','s2@x','admin','invited')`,
);
check("admin cannot add an admin", String(r2).includes("Only the owner"), true);
check(
  "admin can invite researcher (update suspended → active)",
  await as(
    "authenticated",
    ADMIN,
    `update team_members set status='active' where user_id='${SUS}' returning status`,
  ),
  [{ status: "active" }],
);
check(
  "researcher cannot manage team",
  await as(
    "authenticated",
    RES,
    `update team_members set status='suspended' where user_id='${SUS}' returning status`,
  ),
  [],
);
check(
  "owner promotes admin",
  await as(
    "authenticated",
    OWNER,
    `update team_members set role='admin' where user_id='${RES}' returning role`,
  ),
  [{ role: "admin" }],
);
const r3 = await as(
  "authenticated",
  OWNER,
  `update team_members set role='researcher' where user_id='${OWNER}'`,
);
check("owner cannot change own role", String(r3).includes("own role"), true);
check(
  "admin deletes permanently",
  await as("authenticated", ADMIN, `delete from universities where slug='aku' returning slug`),
  [{ slug: "aku" }],
);
check(
  "activity log records the last three changes",
  (
    await as(
      "authenticated",
      ADMIN,
      `select action from activity_log where entity_type='universities' order by id desc limit 3`,
    )
  ).map((r) => r.action),
  ["deleted", "draft", "archived"],
);
check(
  "nobody can write activity log directly",
  typeof (await as("authenticated", OWNER, `insert into activity_log (action,entity_type) values ('x','y')`)),
  "string",
);

if (failed) {
  console.error(`${failed} check(s) failed`);
  process.exit(1);
}
console.log("All access-rule checks passed");
