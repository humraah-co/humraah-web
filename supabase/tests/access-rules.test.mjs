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
 update universities set status='draft', source_url='https://www.aku.edu' where slug='aku';`);

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
  ["deleted", "restored", "archived"],
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

check(
  "invited admin accepts their own invite",
  await as("authenticated", INV2, `select status, role, full_name from accept_invite('Ina Two')`),
  [{ status: "active", role: "admin", full_name: "Ina Two" }],
);
check("the admin joining is logged", await lastTeamLog(INV2), [
  { action: "joined", actor_id: INV2, summary: "Ina Two" },
]);
check(
  "a new admin still cannot make themselves owner",
  String(
    await as("authenticated", INV2, `update team_members set role='owner' where user_id='${INV2}'`),
  ).includes("ERROR"),
  true,
);

// ---------------------------------------------------------------------------
// Content editing (Day 5): saving, publishing, verifying, archiving, the log
// ---------------------------------------------------------------------------
// RES2 is an active researcher and ADM2 an admin (see above).
const SUS2 = "00000000-0000-0000-0000-000000000016";
await db.exec(`insert into auth.users values ('${SUS2}','s3@x');
 insert into team_members (user_id,email,role,status) values ('${SUS2}','s3@x','researcher','suspended');`);
const fieldId = (slug) => `(select id from fields where slug='${slug}')`;
const programme = (field, name) => `jsonb_build_object('field_id', ${fieldId(field)}, 'name', '${name}')`;
const json = (values) => `'${JSON.stringify(values)}'::jsonb`;
const saveUni = (uid, id, values, programmes = "'[]'::jsonb") =>
  as(
    "authenticated",
    uid,
    `select save_university(${id ? `'${id}'` : "null"}, ${json(values)}, ${programmes}) as id`,
  );
const saveSchol = (uid, id, values, fieldIds = "'{}'::uuid[]") =>
  as(
    "authenticated",
    uid,
    `select save_scholarship(${id ? `'${id}'` : "null"}, ${json(values)}, ${fieldIds}) as id`,
  );
const entryLog = async (id) =>
  (
    await as("authenticated", OWNER, `select action from activity_log where entity_id='${id}' order by id`)
  ).map((r) => r.action);
const uni = { slug: "test-university", name: "Test University", city: "Quetta", type: "public" };
const twoProgrammes = `jsonb_build_array(${programme("engineering", "BS Civil Engineering")}, ${programme("law", "LLB")})`;

const created = await saveUni(
  RES2,
  null,
  uni,
  `jsonb_build_array(${programme("engineering", "BS Civil Engineering")})`,
);
const UNI = created[0]?.id;
check("researcher creates a draft university", typeof UNI, "string");
check(
  "a new university starts as a draft, made by the researcher",
  await as(
    "authenticated",
    RES2,
    `select status, created_by, updated_by from universities where id='${UNI}'`,
  ),
  [{ status: "draft", created_by: RES2, updated_by: RES2 }],
);
check(
  "anon cannot see the draft",
  await as("anon", null, `select id from universities where id='${UNI}'`),
  [],
);
check(
  "anon cannot see the draft's programmes",
  await as("anon", null, `select name from programmes where university_id='${UNI}'`),
  [],
);
await saveUni(RES2, UNI, uni, `jsonb_build_array(${programme("engineering", "BS Civil Engineering")})`);
check("saving with no changes logs nothing", await entryLog(UNI), ["created"]);
await saveUni(RES2, UNI, uni, twoProgrammes);
check(
  "a programmes-only change saves the programmes",
  await as(
    "authenticated",
    RES2,
    `select name from programmes where university_id='${UNI}' order by sort_order`,
  ),
  [{ name: "BS Civil Engineering" }, { name: "LLB" }],
);
check("a programmes-only change is logged as an update", await entryLog(UNI), ["created", "updated"]);
check(
  "publishing without a source link is refused",
  String(await saveUni(RES2, UNI, { ...uni, status: "published" }, twoProgrammes)).includes(
    "source link before publishing",
  ),
  true,
);
check("a refused publish changes nothing", await entryLog(UNI), ["created", "updated"]);
await saveUni(
  RES2,
  UNI,
  { ...uni, source_url: "https://example.edu.pk", status: "published" },
  twoProgrammes,
);
check(
  "researcher publishes with a source link",
  await as("authenticated", RES2, `select status, source_url from universities where id='${UNI}'`),
  [{ status: "published", source_url: "https://example.edu.pk" }],
);
check("the edit and the publish are logged separately", await entryLog(UNI), [
  "created",
  "updated",
  "updated",
  "published",
]);
check(
  "anon sees the published university and its programmes",
  await as("anon", null, `select count(*)::int n from programmes where university_id='${UNI}'`),
  [{ n: 2 }],
);
await saveUni(
  RES2,
  UNI,
  {
    ...uni,
    source_url: "https://example.edu.pk",
    status: "published",
    last_verified_at: "2020-01-01",
    created_by: OWNER,
  },
  twoProgrammes,
);
check(
  "the editor cannot set the verified date or the creator",
  await as("authenticated", RES2, `select last_verified_at, created_by from universities where id='${UNI}'`),
  [{ last_verified_at: null, created_by: RES2 }],
);
check(
  "researcher marks the university as verified",
  (
    await as(
      "authenticated",
      RES2,
      `update universities set last_verified_at=now() where id='${UNI}' returning last_verified_at`,
    )
  ).length,
  1,
);
check(
  "verifying without a source link is refused",
  String(
    await as("authenticated", RES2, `update universities set last_verified_at=now() where slug='qau'`),
  ).includes("source link before marking"),
  true,
);
check(
  "a slug already in use is refused",
  String(await saveUni(RES2, null, { ...uni, slug: "qau" })).includes("universities_slug_key"),
  true,
);
check(
  "anon cannot save a university",
  typeof (await saveUni(null, null, { ...uni, slug: "anon-university" })),
  "string",
);
check(
  "a suspended member cannot save a university",
  String(await saveUni(SUS2, null, { ...uni, slug: "suspended-university" })).includes("Only team members"),
  true,
);
check(
  "researcher archives the university",
  await as(
    "authenticated",
    RES2,
    `update universities set status='archived' where id='${UNI}' returning status`,
  ),
  [{ status: "archived" }],
);
check(
  "anon cannot see the archived university",
  await as("anon", null, `select id from universities where id='${UNI}'`),
  [],
);
check(
  "anon cannot see the archived university's programmes",
  await as("anon", null, `select name from programmes where university_id='${UNI}'`),
  [],
);
check(
  "an archived university cannot be edited",
  String(await saveUni(RES2, UNI, { ...uni, name: "Renamed" }, twoProgrammes)).includes("Restore it first"),
  true,
);
check(
  "researcher cannot restore",
  String(
    await as("authenticated", RES2, `update universities set status='draft' where id='${UNI}'`),
  ).includes("Only admins can restore"),
  true,
);
check(
  "researcher cannot delete",
  await as("authenticated", RES2, `delete from universities where id='${UNI}' returning id`),
  [],
);
check(
  "admin restores to draft",
  await as(
    "authenticated",
    ADM2,
    `update universities set status='draft' where id='${UNI}' returning status`,
  ),
  [{ status: "draft" }],
);
check(
  "admin deletes permanently",
  await as("authenticated", ADM2, `delete from universities where id='${UNI}' returning slug`),
  [{ slug: "test-university" }],
);
check(
  "deleting removes the programmes too",
  await as("authenticated", ADM2, `select count(*)::int n from programmes where university_id='${UNI}'`),
  [{ n: 0 }],
);
check("every university change is in the activity log", await entryLog(UNI), [
  "created",
  "updated",
  "updated",
  "published",
  "verified",
  "archived",
  "restored",
  "deleted",
]);
check(
  "the log names who made each change",
  await as(
    "authenticated",
    OWNER,
    `select distinct actor_id from activity_log where entity_id='${UNI}' order by actor_id`,
  ),
  [{ actor_id: ADM2 }, { actor_id: RES2 }],
);

const schol = { slug: "test-scholarship", name: "Test Scholarship", provider: "Test Trust", kind: "need" };
const twoFields = `array[${fieldId("law")}, ${fieldId("education")}]::uuid[]`;
const SCH = (await saveSchol(RES2, null, schol, `array[${fieldId("law")}]::uuid[]`))[0]?.id;
check("researcher creates a draft scholarship", typeof SCH, "string");
check(
  "anon cannot see the draft scholarship's fields",
  await as("anon", null, `select field_id from scholarship_fields where scholarship_id='${SCH}'`),
  [],
);
await saveSchol(RES2, SCH, schol, twoFields);
check(
  "a fields-only change saves the fields",
  await as(
    "authenticated",
    RES2,
    `select count(*)::int n from scholarship_fields where scholarship_id='${SCH}'`,
  ),
  [{ n: 2 }],
);
await saveSchol(RES2, SCH, schol, twoFields);
await saveSchol(RES2, SCH, { ...schol, source_url: "https://example.org", status: "published" }, twoFields);
check(
  "anon sees the published scholarship's fields",
  await as("anon", null, `select count(*)::int n from scholarship_fields where scholarship_id='${SCH}'`),
  [{ n: 2 }],
);
await saveSchol(RES2, SCH, { ...schol, source_url: "https://example.org", status: "draft" }, twoFields);
check(
  "anon cannot see a scholarship moved back to draft",
  await as("anon", null, `select id from scholarships where id='${SCH}'`),
  [],
);
check(
  "a scholarship slug already in use is refused",
  String(await saveSchol(RES2, null, { ...schol, slug: "lums-nop" })).includes("scholarships_slug_key"),
  true,
);
check("every scholarship change is in the activity log", await entryLog(SCH), [
  "created",
  "updated",
  "updated",
  "published",
  "draft",
]);

// ---------------------------------------------------------------------------
// New entries make no public yes/no claims until someone sets them
// ---------------------------------------------------------------------------
check(
  "a new university with no values set is not HEC-recognised, women only or need-based",
  await as(
    "authenticated",
    RES2,
    `insert into universities (slug, name, city) values ('plain-university', 'Plain University', 'Multan')
     returning hec_recognised, women_only, need_based_aid, has_hostel`,
  ),
  [{ hec_recognised: false, women_only: false, need_based_aid: null, has_hostel: null }],
);
const PLAIN = (
  await saveUni(RES2, null, { slug: "plain-editor-university", name: "Plain", city: "Sukkur" })
)[0]?.id;
check(
  "the editor's save makes the same no claims when they aren't set",
  await as(
    "authenticated",
    RES2,
    `select hec_recognised, women_only, need_based_aid, has_hostel from universities where id='${PLAIN}'`,
  ),
  [{ hec_recognised: false, women_only: false, need_based_aid: null, has_hostel: null }],
);
check(
  "a new scholarship with no values set is not for women only",
  await as(
    "authenticated",
    RES2,
    `insert into scholarships (slug, name, provider, kind) values ('plain-scholarship', 'Plain', 'Trust', 'merit')
     returning women_only`,
  ),
  [{ women_only: false }],
);
check(
  "seeded universities keep their HEC recognition",
  await as("anon", null, `select count(*)::int n from universities where hec_recognised`),
  [{ n: 10 }],
);

if (failed) {
  console.error(`${failed} check(s) failed`);
  process.exit(1);
}
console.log("All access-rule checks passed");
