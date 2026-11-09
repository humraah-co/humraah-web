// Access-rule tests for the Higher Education Guide PDFs (guide_files): anyone
// can read which file is current, any active team member can upload and
// replace, only admins and the owner can remove, and invited or suspended
// members, signed-in outsiders and visitors can write nothing. Also checks
// the activity log and the Storage bucket step (skipped where there is no
// storage schema, as in this database).
// Run with: npm run test:db
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { setup } from "./helpers.mjs";

const { db, as, check, refused, finish, OWNER, ADMIN, RESEARCHER, SUSPENDED, OUTSIDER } = await setup();
const migration = fs.readFileSync(
  path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../migrations/20261028000001_guide_files.sql"),
  "utf8",
);

const INVITED = "00000000-0000-0000-0000-0000000000a6";
await db.exec(`insert into auth.users values ('${INVITED}','i@x');
  insert into team_members (user_id,email,role,status) values ('${INVITED}','i@x','researcher','invited');`);

const uuid = (n) => `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
const insert = (who, uid, lang = "en", n = 1) =>
  as(
    who,
    uid,
    `insert into guide_files (language, storage_path, file_name, size_bytes)
     values ('${lang}', '${lang}/${uuid(n)}.pdf', 'guide.pdf', 1000)`,
  );
const replace = (who, uid, lang = "en", n = 2) =>
  as(
    who,
    uid,
    `update guide_files set storage_path = '${lang}/${uuid(n)}.pdf', file_name = 'new.pdf', size_bytes = 2000
     where language = '${lang}' returning language`,
  );
const remove = (who, uid, lang = "en") =>
  as(who, uid, `delete from guide_files where language = '${lang}' returning language`);
const rows = (who, uid) => as(who, uid, "select language from guide_files order by language");
const bothRows = [{ language: "en" }, { language: "ur" }];

// --- Writing without being an active member ---------------------------------
check("a visitor cannot upload", refused(await insert("anon", null), "permission denied"), true);
check(
  "a signed-in person outside the team cannot upload",
  refused(await insert("authenticated", OUTSIDER), "row-level security"),
  true,
);
check(
  "an invited member cannot upload",
  refused(await insert("authenticated", INVITED), "row-level security"),
  true,
);
check(
  "a suspended member cannot upload",
  refused(await insert("authenticated", SUSPENDED), "row-level security"),
  true,
);

// --- Researcher: insert and update, not delete ------------------------------
check("a researcher uploads the English PDF", await insert("authenticated", RESEARCHER), []);
check("a researcher uploads the Urdu PDF", await insert("authenticated", RESEARCHER, "ur", 3), []);
check(
  "there is one row per language",
  refused(await insert("authenticated", RESEARCHER, "en", 9), "duplicate key"),
  true,
);
check("a researcher replaces a PDF", await replace("authenticated", RESEARCHER), [{ language: "en" }]);
check("a researcher cannot remove a PDF", await remove("authenticated", RESEARCHER), []);
check("…and it is still there", await rows("authenticated", RESEARCHER), bothRows);

// --- Everyone reads ---------------------------------------------------------
check("a visitor reads the list", await rows("anon", null), bothRows);
check(
  "a visitor reads path, name, size and date",
  (
    await as(
      "anon",
      null,
      "select storage_path, file_name, size_bytes, updated_at from guide_files where language = 'en'",
    )
  ).length,
  1,
);
check(
  "a visitor cannot see who uploaded it",
  refused(await as("anon", null, "select uploaded_by from guide_files"), "permission denied"),
  true,
);
check("an outsider reads the list", await rows("authenticated", OUTSIDER), bothRows);

// --- Suspended, invited and outside people change nothing -------------------
check("a suspended member cannot replace", await replace("authenticated", SUSPENDED), []);
check("an invited member cannot replace", await replace("authenticated", INVITED), []);
check("an outsider cannot replace", await replace("authenticated", OUTSIDER), []);
check("a suspended member cannot remove", await remove("authenticated", SUSPENDED), []);
check("an invited member cannot remove", await remove("authenticated", INVITED), []);
check("an outsider cannot remove", await remove("authenticated", OUTSIDER), []);
check("a visitor cannot replace", refused(await replace("anon", null), "permission denied"), true);
check("a visitor cannot remove", refused(await remove("anon", null), "permission denied"), true);

// --- Stamping ----------------------------------------------------------------
check(
  "uploaded_by is the signed-in member",
  await as(
    "authenticated",
    RESEARCHER,
    `select uploaded_by = '${RESEARCHER}' as me from guide_files where language = 'en'`,
  ),
  [{ me: true }],
);
check(
  "a forged uploaded_by is overwritten",
  await as(
    "authenticated",
    ADMIN,
    `update guide_files set uploaded_by = '${OWNER}', file_name = 'x.pdf' where language = 'ur'
     returning uploaded_by = '${ADMIN}' as me`,
  ),
  [{ me: true }],
);

// --- The path, size and language must be valid -------------------------------
const refusedUpdate = async (set, label) =>
  check(
    label,
    refused(
      await as("authenticated", ADMIN, `update guide_files set ${set} where language = 'en'`),
      "check constraint",
    ),
    true,
  );
await refusedUpdate(`storage_path = 'ur/${uuid(7)}.pdf'`, "a path in the other language's folder is refused");
await refusedUpdate(`storage_path = 'en/../secret.pdf'`, "a path that is not one of ours is refused");
await refusedUpdate(`size_bytes = 26214401`, "a size over 25 MB is refused");
await refusedUpdate(`size_bytes = 0`, "an empty file is refused");
check(
  "another language code is refused",
  refused(
    await as(
      "authenticated",
      ADMIN,
      `insert into guide_files (language, storage_path, file_name, size_bytes)
       values ('fr', 'fr/${uuid(8)}.pdf', 'a.pdf', 5)`,
    ),
    "check constraint",
  ),
  true,
);

// --- Admin and owner: all three ---------------------------------------------
check("an admin replaces a PDF", await replace("authenticated", ADMIN, "en", 5), [{ language: "en" }]);
check("an admin removes a PDF", await remove("authenticated", ADMIN, "en"), [{ language: "en" }]);
check("an admin uploads again", await insert("authenticated", ADMIN, "en", 6), []);
check("the owner removes the Urdu PDF", await remove("authenticated", OWNER, "ur"), [{ language: "ur" }]);
check("the owner uploads", await insert("authenticated", OWNER, "ur", 10), []);
check("the owner replaces", await replace("authenticated", OWNER, "ur", 11), [{ language: "ur" }]);

// --- Activity log ------------------------------------------------------------
const log = (
  await db.query(
    `select action, entity_id, summary, actor_id from activity_log where entity_type = 'guide_files' order by id`,
  )
).rows;
check(
  "each upload, replacement and removal is logged (and a name-only change is not)",
  log.map((l) => `${l.action}:${l.entity_id}`),
  [
    "uploaded:en",
    "uploaded:ur",
    "replaced:en",
    "replaced:en",
    "removed:en",
    "uploaded:en",
    "removed:ur",
    "uploaded:ur",
    "replaced:ur",
  ],
);
check(
  "the log names the guide and the member",
  log.slice(0, 2).map((l) => [l.summary, l.actor_id]),
  [
    ["the English guide PDF", RESEARCHER],
    ["the Urdu guide PDF", RESEARCHER],
  ],
);

// --- The bucket step ---------------------------------------------------------
// This database has no storage schema, so the migration ran without it (the
// setup above applied it without an error). Give it a storage.buckets table
// like Supabase's and run it again: it must make the bucket public, PDF-only
// and 25 MB at most, and be safe to run once more.
check(
  "no storage schema here, so no bucket step ran",
  (await db.query("select to_regclass('storage.buckets') as t")).rows,
  [{ t: null }],
);
await db.exec(`create schema storage;
  create table storage.buckets (id text primary key, name text not null, public boolean default false,
    file_size_limit bigint, allowed_mime_types text[]);
  insert into storage.buckets (id, name, public) values ('guides', 'guides', false);`);
await db.exec(migration);
await db.exec(migration);
check(
  "with a storage schema the bucket is public, PDF-only and capped at 25 MB",
  (await db.query("select id, public, file_size_limit::int as size, allowed_mime_types from storage.buckets"))
    .rows,
  [{ id: "guides", public: true, size: 26214400, allowed_mime_types: ["application/pdf"] }],
);

finish("guide file");
