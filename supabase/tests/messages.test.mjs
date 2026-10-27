// Access-rule tests for the messages inbox: contact messages hold visitors'
// personal details, so only admins and the owner can read or change their
// read and archived state, and nobody can edit or delete what was written.
// Run with: npm run test:db
import { setup } from "./helpers.mjs";

const { db, as, check, refused, finish, OWNER, ADMIN, RESEARCHER, SUSPENDED, OUTSIDER } = await setup();

const send = (who, uid, name = "Aisha", email = "aisha@example.pk", message = "Hello, I have a question.") =>
  as(
    who,
    uid,
    `insert into contact_messages (name, email, message) values ('${name}', '${email}', '${message}')`,
  );

// --- Sending ----------------------------------------------------------------
check("a visitor sends a message", await send("anon", null), []);
check(
  "a signed-in person sends a message too",
  await send("authenticated", OUTSIDER, "Sana", "sana@example.pk"),
  [],
);
check(
  "a researcher sends a message too",
  await send("authenticated", RESEARCHER, "Rida", "rida@example.pk"),
  [],
);
check(
  "a visitor cannot send a message already marked read",
  refused(
    await as(
      "anon",
      null,
      `insert into contact_messages (name, email, message, read_at) values ('x', 'x@example.pk', 'x', now())`,
    ),
    "permission denied",
  ),
  true,
);
check(
  "a visitor cannot send a message already archived or handled",
  [
    refused(
      await as(
        "anon",
        null,
        `insert into contact_messages (name, email, message, archived_at) values ('x', 'x@example.pk', 'x', now())`,
      ),
      "permission denied",
    ),
    refused(
      await as(
        "anon",
        null,
        `insert into contact_messages (name, email, message, handled) values ('x', 'x@example.pk', 'x', true)`,
      ),
      "permission denied",
    ),
  ],
  [true, true],
);
check(
  "the table's own limits still apply (an empty name)",
  refused(await send("anon", null, "", "x@example.pk"), "check constraint"),
  true,
);
check(
  "the table's own limits still apply (an email without @)",
  refused(await send("anon", null, "Zoya", "not-an-email"), "check constraint"),
  true,
);
check(
  "a new message is unread and not archived",
  await as(
    "authenticated",
    ADMIN,
    `select read_at, archived_at, read_by from contact_messages where name='Aisha'`,
  ),
  [{ read_at: null, archived_at: null, read_by: null }],
);

// --- Who can read -------------------------------------------------------------
const count = "select count(*)::int n from contact_messages";
check("an admin reads the messages", await as("authenticated", ADMIN, count), [{ n: 3 }]);
check("the owner reads the messages", await as("authenticated", OWNER, count), [{ n: 3 }]);
check("a researcher sees none of them", await as("authenticated", RESEARCHER, count), [{ n: 0 }]);
check(
  "a researcher cannot find one by name either",
  await as("authenticated", RESEARCHER, `select id from contact_messages where name='Aisha'`),
  [],
);
check("a signed-in non-member sees none", await as("authenticated", OUTSIDER, count), [{ n: 0 }]);
check("a suspended member sees none", await as("authenticated", SUSPENDED, count), [{ n: 0 }]);
check("anon cannot read at all", typeof (await as("anon", null, count)), "string");

await db.exec(`update team_members set status='suspended' where user_id='${ADMIN}'`);
check("an admin who has been suspended sees none", await as("authenticated", ADMIN, count), [{ n: 0 }]);
await db.exec(`update team_members set status='active' where user_id='${ADMIN}'`);

// --- Read and unread -------------------------------------------------------------
const AISHA = (await as("authenticated", ADMIN, `select id from contact_messages where name='Aisha'`))[0].id;
check(
  "an admin marks a message read; the database stamps the time and the person",
  await as(
    "authenticated",
    ADMIN,
    `update contact_messages set read_at = '2001-01-01', read_by = '${OWNER}' where id='${AISHA}'
     returning read_at > now() - interval '1 minute' as now_ish, read_by`,
  ),
  [{ now_ish: true, read_by: ADMIN }],
);
check(
  "marking it read again keeps the first stamp",
  await as(
    "authenticated",
    OWNER,
    `update contact_messages set read_at = now() where id='${AISHA}' returning read_by`,
  ),
  [{ read_by: ADMIN }],
);
check(
  "the owner marks it unread; the stamp is cleared",
  await as(
    "authenticated",
    OWNER,
    `update contact_messages set read_at = null where id='${AISHA}' returning read_at, read_by`,
  ),
  [{ read_at: null, read_by: null }],
);
check(
  "a researcher cannot mark a message read (nothing changes)",
  await as(
    "authenticated",
    RESEARCHER,
    `update contact_messages set read_at = now() where id='${AISHA}' returning id`,
  ),
  [],
);
check(
  "anon cannot mark a message read",
  typeof (await as("anon", null, `update contact_messages set read_at = now() where id='${AISHA}'`)),
  "string",
);
await as("authenticated", ADMIN, `update contact_messages set read_at = now() where id='${AISHA}'`);
check(
  "unread count: one read, two unread",
  await as(
    "authenticated",
    ADMIN,
    `select count(*)::int n from contact_messages where read_at is null and archived_at is null`,
  ),
  [{ n: 2 }],
);

// --- Archiving ---------------------------------------------------------------------
check(
  "an admin archives a message",
  await as(
    "authenticated",
    ADMIN,
    `update contact_messages set archived_at = now() where id='${AISHA}' returning archived_by`,
  ),
  [{ archived_by: ADMIN }],
);
check(
  "a researcher cannot archive or restore one",
  await as(
    "authenticated",
    RESEARCHER,
    `update contact_messages set archived_at = null where id='${AISHA}' returning id`,
  ),
  [],
);
check(
  "the owner takes it out of the archive",
  await as(
    "authenticated",
    OWNER,
    `update contact_messages set archived_at = null where id='${AISHA}' returning archived_at, archived_by`,
  ),
  [{ archived_at: null, archived_by: null }],
);

// --- What nobody can change ------------------------------------------------------------
for (const [what, sql] of [
  ["the sender's name", `update contact_messages set name = 'Someone else' where id='${AISHA}'`],
  ["the sender's email", `update contact_messages set email = 'other@example.pk' where id='${AISHA}'`],
  ["the text", `update contact_messages set message = 'edited' where id='${AISHA}'`],
  ["when it was sent", `update contact_messages set created_at = now() where id='${AISHA}'`],
]) {
  check(
    `even the owner cannot change ${what}`,
    refused(await as("authenticated", OWNER, sql), "permission denied"),
    true,
  );
}
check(
  "an admin cannot delete a message",
  refused(
    await as("authenticated", ADMIN, `delete from contact_messages where id='${AISHA}'`),
    "permission denied",
  ),
  true,
);
check(
  "the owner cannot delete a message",
  refused(
    await as("authenticated", OWNER, `delete from contact_messages where id='${AISHA}'`),
    "permission denied",
  ),
  true,
);
check(
  "the message is still there",
  await as("authenticated", OWNER, `select message from contact_messages where id='${AISHA}'`),
  [{ message: "Hello, I have a question." }],
);

// --- The activity log ----------------------------------------------------------------------
const log = await as(
  "authenticated",
  RESEARCHER,
  `select action, summary, actor_id from activity_log where entity_type='contact_messages' and entity_id='${AISHA}' order by id`,
);
check(
  "reading, un-reading, archiving and restoring are logged, with who did it",
  log.map((r) => [r.action, r.actor_id]),
  [
    ["read", ADMIN],
    ["unread", OWNER],
    ["read", ADMIN],
    ["archived", ADMIN],
    ["unarchived", OWNER],
  ],
);
check(
  "the log says only 'a contact message': no name, email or text",
  [...new Set(log.map((r) => r.summary))],
  ["a contact message"],
);
check(
  "nothing about a visitor's details is anywhere in the log",
  await as(
    "authenticated",
    RESEARCHER,
    `select count(*)::int n from activity_log where summary ilike '%aisha%' or summary ilike '%example.pk%' or summary ilike '%question%'`,
  ),
  [{ n: 0 }],
);
check(
  "sending a message is not logged",
  await as(
    "authenticated",
    OWNER,
    `select count(*)::int n from activity_log where entity_type='contact_messages' and action='created'`,
  ),
  [{ n: 0 }],
);

finish("messages");
