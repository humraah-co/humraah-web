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
  "anon sees the published guidance articles",
  await as("anon", null, `select slug from guidance_articles order by sort_order`),
  [
    { slug: "how-to-research-a-university" },
    { slug: "finding-the-right-university" },
    { slug: "admissions-and-application-guide" },
  ],
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

// ---------------------------------------------------------------------------
// Team management (Day 4): invites, accepting, suspending, the activity log
// ---------------------------------------------------------------------------
const ADM2 = "00000000-0000-0000-0000-000000000011",
  RES2 = "00000000-0000-0000-0000-000000000012",
  INV = "00000000-0000-0000-0000-000000000013",
  INV2 = "00000000-0000-0000-0000-000000000014",
  INV3 = "00000000-0000-0000-0000-000000000015";
await db.exec(`insert into auth.users values ('${ADM2}','a2@x'),('${RES2}','r2@x'),('${INV}','i@x'),('${INV2}','i2@x'),('${INV3}','i3@x');
 insert into team_members (user_id,email,full_name,role,status) values ('${ADM2}','a2@x','Admin Two','admin','active'),('${RES2}','r2@x','Res Two','researcher','active');`);
const lastTeamLog = async (uid) =>
  as(
    "authenticated",
    OWNER,
    `select action, actor_id, summary from activity_log where entity_type='team_members' and entity_id='${uid}' order by id desc limit 1`,
  );

check(
  "admin invites a researcher",
  await as(
    "authenticated",
    ADM2,
    `insert into team_members (user_id,email,full_name,role,status,invited_by) values ('${INV}','i@x','Ina','researcher','invited','${ADM2}') returning status`,
  ),
  [{ status: "invited" }],
);
check("the invite is logged with who sent it", await lastTeamLog(INV), [
  { action: "invited", actor_id: ADM2, summary: "Ina" },
]);
check(
  "researcher cannot invite",
  typeof (await as(
    "authenticated",
    RES2,
    `insert into team_members (user_id,email,role,status) values ('${INV3}','i3@x','researcher','invited')`,
  )),
  "string",
);
check(
  "invited person sees only their own team row",
  await as("authenticated", INV, `select user_id from team_members`),
  [{ user_id: INV }],
);
check(
  "invited person cannot activate themselves directly",
  await as(
    "authenticated",
    INV,
    `update team_members set status='active' where user_id='${INV}' returning status`,
  ),
  [],
);
check(
  "anon cannot accept an invite",
  typeof (await as("anon", null, `select * from accept_invite('Ina')`)),
  "string",
);
check(
  "invited person accepts with their name",
  await as("authenticated", INV, `select status, full_name from accept_invite('  Ina Khan ')`),
  [{ status: "active", full_name: "Ina Khan" }],
);
check("accepting is logged as joining", await lastTeamLog(INV), [
  { action: "joined", actor_id: INV, summary: "Ina Khan" },
]);
check(
  "an invite can only be accepted once",
  String(await as("authenticated", INV, `select * from accept_invite('Ina')`)).includes("no pending invite"),
  true,
);
check(
  "an active member cannot use accept_invite",
  String(await as("authenticated", SUS, `select * from accept_invite('S')`)).includes("no pending invite"),
  true,
);
check(
  "owner invites an admin",
  await as(
    "authenticated",
    OWNER,
    `insert into team_members (user_id,email,role,status) values ('${INV2}','i2@x','admin','invited') returning role`,
  ),
  [{ role: "admin" }],
);
check(
  "accepting needs a name",
  String(await as("authenticated", INV2, `select * from accept_invite('   ')`)).includes("Name must"),
  true,
);
check(
  "admin cannot resend an admin's invite",
  String(await as("authenticated", ADM2, `select record_invite_resent('${INV2}')`)).includes(
    "Only the owner",
  ),
  true,
);
check(
  "researcher cannot resend invites",
  String(await as("authenticated", RES2, `select record_invite_resent('${INV2}')`)).includes("Only admins"),
  true,
);
check(
  "resending needs a pending invite",
  String(await as("authenticated", OWNER, `select record_invite_resent('${RES2}')`)).includes(
    "no pending invite",
  ),
  true,
);
check(
  "owner resends an invite",
  Array.isArray(await as("authenticated", OWNER, `select record_invite_resent('${INV2}')`)),
  true,
);
check("the resend is logged", await lastTeamLog(INV2), [
  { action: "invite_resent", actor_id: OWNER, summary: "i2@x" },
]);
check(
  "owner cannot suspend themselves",
  String(
    await as("authenticated", OWNER, `update team_members set status='suspended' where user_id='${OWNER}'`),
  ).includes("own status"),
  true,
);
check(
  "admin cannot suspend themselves",
  typeof (await as(
    "authenticated",
    ADM2,
    `update team_members set status='suspended' where user_id='${ADM2}' returning status`,
  )),
  "string",
);
check(
  "nobody can remove themselves",
  String(await as("authenticated", OWNER, `delete from team_members where user_id='${OWNER}'`)).includes(
    "remove yourself",
  ),
  true,
);
check(
  "admin cannot suspend another admin",
  String(
    await as("authenticated", ADM2, `update team_members set status='suspended' where user_id='${ADMIN}'`),
  ).includes("Only the owner"),
  true,
);
check(
  "admin suspends a researcher",
  await as(
    "authenticated",
    ADM2,
    `update team_members set status='suspended' where user_id='${RES2}' returning status`,
  ),
  [{ status: "suspended" }],
);
check("the suspension is logged", await lastTeamLog(RES2), [
  { action: "suspended", actor_id: ADM2, summary: "Res Two" },
]);
check(
  "a suspended researcher can no longer read the team",
  await as("authenticated", RES2, `select user_id from team_members where user_id<>'${RES2}'`),
  [],
);
check(
  "admin reactivates a researcher",
  await as(
    "authenticated",
    ADM2,
    `update team_members set status='active' where user_id='${RES2}' returning status`,
  ),
  [{ status: "active" }],
);
check("the reactivation is logged", await lastTeamLog(RES2), [
  { action: "reactivated", actor_id: ADM2, summary: "Res Two" },
]);
await as(
  "authenticated",
  ADM2,
  `insert into team_members (user_id,email,role,status) values ('${INV3}','i3@x','researcher','invited')`,
);
check(
  "admin revokes a pending invite",
  await as("authenticated", ADM2, `delete from team_members where user_id='${INV3}' returning user_id`),
  [{ user_id: INV3 }],
);
check("the revoke is logged", await lastTeamLog(INV3), [
  { action: "invite_revoked", actor_id: ADM2, summary: "i3@x" },
]);

if (failed) {
  console.error(`${failed} check(s) failed`);
  process.exit(1);
}
console.log("All access-rule checks passed");
