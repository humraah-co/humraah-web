// Access-rule tests for the fields-of-study, resources and guidance editors:
// who can read, save, publish, verify, archive, restore and delete, and that
// every change reaches the activity log.
// Run with: npm run test:db
import { setup } from "./helpers.mjs";

const { as, check, refused, finish, json, OWNER, ADMIN, RESEARCHER, SUSPENDED, OUTSIDER } = await setup();

const SRC = "https://www.hec.gov.pk";
const tables = {
  fields: {
    save: "save_field",
    one: { slug: "test-field", name: "Test field", summary: "A summary", interests: ["Maths"] },
    edit: { slug: "test-field", name: "Test field", summary: "A longer summary", interests: ["Maths"] },
    urdu: { name_ur: "ٹیسٹ", summary_ur: "خلاصہ", interests_ur: ["حساب"] },
    other: (n) => ({ slug: n, name: n }),
  },
  resources: {
    save: "save_resource",
    one: { title: "Test resource", url: "https://example.pk/a", category: "official" },
    edit: { title: "Test resource", url: "https://example.pk/b", category: "official" },
    urdu: { title_ur: "ٹیسٹ", description_ur: "تفصیل" },
    other: (n) => ({ title: n, url: `https://example.pk/${n}`, category: "tests" }),
  },
  guidance_articles: {
    save: "save_guidance_article",
    one: { slug: "test-article", title: "Test article", summary: "Short", body_markdown: "## One\nText" },
    edit: {
      slug: "test-article",
      title: "Test article",
      summary: "Short",
      body_markdown: "## One\nMore text",
    },
    urdu: { title_ur: "ٹیسٹ", summary_ur: "مختصر", body_markdown_ur: "## ایک\nمتن" },
    other: (n) => ({ slug: n, title: n }),
  },
};

const log = async (table, id) =>
  (
    await as(
      "authenticated",
      OWNER,
      `select action from activity_log where entity_type='${table}' and entity_id='${id}' order by id`,
    )
  ).map((r) => r.action);

for (const [table, t] of Object.entries(tables)) {
  const save = (uid, id, values) =>
    as("authenticated", uid, `select ${t.save}(${id ? `'${id}'` : "null"}, ${json(values)}) as id`);
  const status = async (id) =>
    (await as("authenticated", OWNER, `select status from ${table} where id='${id}'`))[0]?.status;
  const name = `[${table}]`;
  const urduKey = Object.keys(t.urdu)[0];
  const urduValue = Object.values(t.urdu)[0];

  // --- Reading and creating -------------------------------------------------
  const seeded = (await as("anon", null, `select count(*)::int n from ${table}`))[0].n;
  check(
    `${name} anon reads only published rows`,
    await as("anon", null, `select count(*)::int n from ${table} where status <> 'published'`),
    [{ n: 0 }],
  );

  check(
    `${name} publishing a new entry with no source link is refused, and nothing is created`,
    [
      refused(await save(RESEARCHER, null, { ...t.other("unsourced"), status: "published" }), "source link"),
      (await as("authenticated", OWNER, `select count(*)::int n from ${table}`))[0].n,
    ],
    [true, seeded],
  );
  const created = await save(RESEARCHER, null, { ...t.one, id: "00000000-0000-0000-0000-00000000dead" });
  const ID = created[0]?.id;
  check(`${name} a researcher creates an entry`, typeof ID, "string");
  check(
    `${name} it starts as a draft and takes no id from the form`,
    await as(
      "authenticated",
      OWNER,
      `select status, id <> '00000000-0000-0000-0000-00000000dead' as own_id from ${table} where id='${ID}'`,
    ),
    [{ status: "draft", own_id: true }],
  );
  check(`${name} anon cannot see the draft`, await as("anon", null, `select count(*)::int n from ${table}`), [
    { n: seeded },
  ]);
  check(
    `${name} the suspended and outsiders cannot see the draft`,
    [
      (await as("authenticated", SUSPENDED, `select count(*)::int n from ${table}`))[0].n,
      (await as("authenticated", OUTSIDER, `select count(*)::int n from ${table}`))[0].n,
    ],
    [seeded, seeded],
  );
  check(`${name} creating is logged`, await log(table, ID), ["created"]);

  // --- Who can save ---------------------------------------------------------
  check(
    `${name} anon cannot call the save function`,
    refused(await as("anon", null, `select ${t.save}(null, ${json(t.one)})`), "permission denied"),
    true,
  );
  check(
    `${name} a suspended researcher cannot save`,
    refused(await save(SUSPENDED, ID, t.edit), "Only team members can edit entries"),
    true,
  );
  check(
    `${name} a signed-in non-member cannot save`,
    refused(await save(OUTSIDER, null, t.other("outsider")), "Only team members can edit entries"),
    true,
  );
  check(
    `${name} saving with no changes writes nothing`,
    [await save(RESEARCHER, ID, t.one), await log(table, ID)],
    [[{ id: ID }], ["created"]],
  );

  // --- Editing, Urdu --------------------------------------------------------
  await save(RESEARCHER, ID, { ...t.edit, ...t.urdu, not_a_column: "x", created_by: OUTSIDER });
  check(
    `${name} a researcher edits a draft, Urdu included; unknown columns are ignored`,
    await as("authenticated", OWNER, `select ${urduKey}, created_by from ${table} where id='${ID}'`),
    [{ [urduKey]: urduValue, created_by: RESEARCHER }],
  );
  check(
    `${name} anon cannot read a draft's Urdu`,
    await as("anon", null, `select ${urduKey} from ${table} where id='${ID}'`),
    [],
  );
  check(`${name} an edit is logged as an update`, await log(table, ID), ["created", "updated"]);

  // --- Publishing needs a source ---------------------------------------------
  check(
    `${name} publishing without a source link is refused`,
    refused(await save(RESEARCHER, ID, { ...t.edit, status: "published" }), "source link"),
    true,
  );
  check(
    `${name} the refused publish changed nothing`,
    [await status(ID), await log(table, ID)],
    ["draft", ["created", "updated"]],
  );
  check(
    `${name} a blank source link does not count`,
    refused(await save(RESEARCHER, ID, { ...t.edit, source_url: "   ", status: "published" }), "source link"),
    true,
  );
  await save(RESEARCHER, ID, { ...t.edit, source_url: SRC, status: "published" });
  check(`${name} a researcher publishes with a source link`, await status(ID), "published");
  check(
    `${name} anon now reads it, with its Urdu`,
    await as("anon", null, `select ${urduKey} from ${table} where id='${ID}'`),
    [{ [urduKey]: urduValue }],
  );
  check(`${name} the edit and the publish are logged separately`, await log(table, ID), [
    "created",
    "updated",
    "updated",
    "published",
  ]);

  // --- Verifying ------------------------------------------------------------
  const NOSRC = (await save(RESEARCHER, null, t.other("no-source")))[0]?.id;
  check(
    `${name} marking verified without a source link is refused`,
    refused(
      await as(
        "authenticated",
        RESEARCHER,
        `update ${table} set last_verified_at = now() where id='${NOSRC}'`,
      ),
      "source link",
    ),
    true,
  );
  check(
    `${name} a researcher marks an entry verified`,
    await as(
      "authenticated",
      RESEARCHER,
      `update ${table} set last_verified_at = now() where id='${ID}' returning last_verified_at is not null as v`,
    ),
    [{ v: true }],
  );
  check(`${name} verifying is logged`, (await log(table, ID)).at(-1), "verified");

  // --- Moving to drafts, archiving ------------------------------------------
  await save(RESEARCHER, ID, { ...t.edit, source_url: SRC, status: "draft" });
  check(`${name} a researcher moves a published entry back to drafts`, await status(ID), "draft");
  check(
    `${name} anon no longer sees it`,
    await as("anon", null, `select count(*)::int n from ${table} where id='${ID}'`),
    [{ n: 0 }],
  );
  check(
    `${name} a draft cannot be deleted, even by the owner`,
    refused(
      await as("authenticated", OWNER, `delete from ${table} where id='${ID}'`),
      "Only archived entries can be deleted",
    ),
    true,
  );
  check(
    `${name} a researcher archives`,
    await as(
      "authenticated",
      RESEARCHER,
      `update ${table} set status='archived' where id='${ID}' returning status`,
    ),
    [{ status: "archived" }],
  );
  check(
    `${name} an archived entry cannot be saved over`,
    refused(await save(RESEARCHER, ID, { ...t.edit, summary: "x", title: "x" }), "Restore it first"),
    true,
  );
  check(
    `${name} an archived entry is not public`,
    await as("anon", null, `select count(*)::int n from ${table} where id='${ID}'`),
    [{ n: 0 }],
  );

  // --- Restoring and deleting -------------------------------------------------
  check(
    `${name} a researcher cannot restore`,
    refused(
      await as("authenticated", RESEARCHER, `update ${table} set status='draft' where id='${ID}'`),
      "Only admins can restore",
    ),
    true,
  );
  check(
    `${name} a researcher cannot delete (nothing is removed)`,
    await as("authenticated", RESEARCHER, `delete from ${table} where id='${ID}' returning id`),
    [],
  );
  check(
    `${name} an admin restores to drafts`,
    await as("authenticated", ADMIN, `update ${table} set status='draft' where id='${ID}' returning status`),
    [{ status: "draft" }],
  );
  await as("authenticated", RESEARCHER, `update ${table} set status='archived' where id='${ID}'`);
  check(
    `${name} the owner restores to drafts`,
    await as("authenticated", OWNER, `update ${table} set status='draft' where id='${ID}' returning status`),
    [{ status: "draft" }],
  );
  await as("authenticated", RESEARCHER, `update ${table} set status='archived' where id='${ID}'`);
  check(
    `${name} a suspended member cannot delete`,
    await as("authenticated", SUSPENDED, `delete from ${table} where id='${ID}' returning id`),
    [],
  );
  check(
    `${name} anon cannot delete`,
    typeof (await as("anon", null, `delete from ${table} where id='${ID}' returning id`)),
    "string",
  );
  check(
    `${name} an admin deletes an archived entry`,
    await as("authenticated", ADMIN, `delete from ${table} where id='${ID}' returning id`),
    [{ id: ID }],
  );
  check(`${name} every step is in the activity log`, await log(table, ID), [
    "created",
    "updated",
    "updated",
    "published",
    "verified",
    "draft",
    "archived",
    "restored",
    "archived",
    "restored",
    "archived",
    "deleted",
  ]);

  const OWNED = (await save(RESEARCHER, null, t.other("owner-deletes")))[0]?.id;
  await as("authenticated", RESEARCHER, `update ${table} set status='archived' where id='${OWNED}'`);
  check(
    `${name} the owner deletes an archived entry`,
    await as("authenticated", OWNER, `delete from ${table} where id='${OWNED}' returning id`),
    [{ id: OWNED }],
  );
  check(
    `${name} nobody can write the activity log directly`,
    typeof (await as(
      "authenticated",
      OWNER,
      `insert into activity_log (action,entity_type) values ('x','y')`,
    )),
    "string",
  );

  // --- Unique web address, and its shape ---------------------------------------
  if ("slug" in t.one) {
    const first = (await save(RESEARCHER, null, t.other("taken-address")))[0]?.id;
    check(
      `${name} a web address can only be used once`,
      refused(await save(RESEARCHER, null, t.other("taken-address")), "duplicate key"),
      true,
    );
    check(
      `${name} a web address must be lower-case words and hyphens`,
      refused(
        await save(RESEARCHER, first, { ...t.other("taken-address"), slug: "Not Valid" }),
        "check constraint",
      ),
      true,
    );
  }
}

// --- Fields of study ----------------------------------------------------------
const field = (uid, id, values) =>
  as("authenticated", uid, `select save_field(${id ? `'${id}'` : "null"}, ${json(values)}) as id`);
const lawId = (await as("anon", null, `select id from fields where slug='law'`))[0].id;
check(
  "the ten fields are published to start with",
  await as("anon", null, `select count(*)::int n from fields where status='published'`),
  [{ n: 10 }],
);
check(
  "a quiz field keeps its web address",
  refused(await field(RESEARCHER, lawId, { slug: "law-studies", name: "Law" }), "used by the quiz"),
  true,
);
check(
  "a quiz field can still be renamed",
  (await field(RESEARCHER, lawId, { slug: "law", name: "Law and justice" })).length,
  1,
);
check(
  "its web address is unchanged after that save",
  await as("anon", null, `select slug, name from fields where id='${lawId}'`),
  [{ slug: "law", name: "Law and justice" }],
);
const custom = (await field(RESEARCHER, null, { slug: "agriculture", name: "Agriculture" }))[0]?.id;
check(
  "a field added later can change its web address",
  (await field(RESEARCHER, custom, { slug: "agriculture-sciences", name: "Agriculture" })).length,
  1,
);
await field(RESEARCHER, custom, {
  slug: "agriculture-sciences",
  name: "Agriculture",
  example_programmes: ["Agronomy"],
  example_programmes_ur: ["زراعت"],
});
check(
  "example programmes stay English: Urdu for them is not saved",
  await as(
    "authenticated",
    OWNER,
    `select example_programmes, example_programmes_ur from fields where id='${custom}'`,
  ),
  [{ example_programmes: ["Agronomy"], example_programmes_ur: null }],
);
const [{ id: someUniversity }] = await as("anon", null, `select id from universities limit 1`);
await as(
  "authenticated",
  RESEARCHER,
  `insert into programmes (university_id, field_id, name) values ('${someUniversity}', '${custom}', 'BS Agronomy')`,
);
await as("authenticated", RESEARCHER, `update fields set status='archived' where id='${custom}'`);
await as("authenticated", ADMIN, `delete from fields where id='${custom}'`);
check(
  "deleting a field leaves its programmes in place, without a field",
  await as("authenticated", OWNER, `select field_id from programmes where name='BS Agronomy'`),
  [{ field_id: null }],
);

// --- Resources ------------------------------------------------------------------
const resource = (uid, id, values) =>
  as("authenticated", uid, `select save_resource(${id ? `'${id}'` : "null"}, ${json(values)}) as id`);
for (const url of [
  "javascript:alert(1)",
  "ftp://example.pk/a",
  "example.pk/no-scheme",
  "https://has space.pk",
]) {
  check(
    `a resource link must be a web link: ${url}`,
    refused(
      await resource(RESEARCHER, null, { title: "Bad", url, category: "tests" }),
      "resources_url_is_web_link",
    ),
    true,
  );
}
check(
  "a resource needs a category",
  refused(
    await resource(RESEARCHER, null, { title: "No category", url: "https://example.pk/c" }),
    "null value",
  ),
  true,
);
await resource(RESEARCHER, null, {
  title: "Ordered",
  url: "https://example.pk/o",
  category: "tests",
  sort_order: 7,
});
check(
  "a resource's order is saved",
  await as("authenticated", OWNER, `select sort_order from resources where title='Ordered'`),
  [{ sort_order: 7 }],
);

// --- Guidance ---------------------------------------------------------------------
check(
  "a guidance article can be a draft with no body yet",
  await as(
    "authenticated",
    RESEARCHER,
    `select save_guidance_article(null, ${json({ slug: "empty-body", title: "Empty" })}) is not null as ok`,
  ),
  [{ ok: true }],
);

finish("content editor");
