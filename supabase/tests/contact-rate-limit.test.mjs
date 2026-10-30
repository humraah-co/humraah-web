// Tests for the contact form's rate limit: about five messages an hour per
// sender, counted by a keyed hash of the IP address, and a table that only
// the web server (service_role, through check_contact_rate) can reach.
// Run with: npm run test:db
import { setup } from "./helpers.mjs";

const { db, as, check, refused, finish, OWNER, ADMIN, RESEARCHER } = await setup();

const A = "a".repeat(64);
const B = "b".repeat(64);
const rate = (who, uid, hash, extra = "") =>
  as(who, uid, `select public.check_contact_rate('${hash}'${extra}) ok`);

// --- The limit ---------------------------------------------------------------
const first = [];
for (let i = 0; i < 6; i++) first.push((await rate("service_role", null, A))[0].ok);
check("the first five are allowed and the sixth is not", first, [true, true, true, true, true, false]);
check(
  "a refused attempt is not recorded",
  await db.query(`select count(*)::int n from contact_rate_limits where ip_hash='${A}'`).then((r) => r.rows),
  [{ n: 5 }],
);
check("another sender is not affected", await rate("service_role", null, B), [{ ok: true }]);

await db.exec(
  `update contact_rate_limits set created_at = now() - interval '61 minutes' where ip_hash='${A}'`,
);
check("after an hour the sender can send again", await rate("service_role", null, A), [{ ok: true }]);

check(
  "a different limit and window can be passed in",
  [
    (await rate("service_role", null, "c".repeat(64), ", 1"))[0].ok,
    (await rate("service_role", null, "c".repeat(64), ", 1"))[0].ok,
  ],
  [true, false],
);

await db.exec(
  `insert into contact_rate_limits (ip_hash, created_at) values ('${"d".repeat(64)}', now() - interval '2 days')`,
);
await rate("service_role", null, B);
check(
  "rows older than a day are cleaned up",
  await db
    .query(`select count(*)::int n from contact_rate_limits where ip_hash='${"d".repeat(64)}'`)
    .then((r) => r.rows),
  [{ n: 0 }],
);

check(
  "a missing or short hash is refused, so one bucket can't be shared by accident",
  [
    refused(await as("service_role", null, `select public.check_contact_rate(null)`), "keyed hash"),
    refused(await as("service_role", null, `select public.check_contact_rate('abc')`), "keyed hash"),
  ],
  [true, true],
);

// --- Access rules on the table -----------------------------------------------------
const table = "contact_rate_limits";
for (const [who, uid] of [
  ["anon", null],
  ["authenticated", null],
  ["authenticated", RESEARCHER],
  ["authenticated", ADMIN],
  ["authenticated", OWNER],
]) {
  const label = `${who}${uid ? ` (${uid.slice(-2)})` : ""}`;
  check(
    `${label} cannot read the table`,
    refused(await as(who, uid, `select * from ${table}`), "permission denied"),
    true,
  );
  check(
    `${label} cannot add a row`,
    refused(await as(who, uid, `insert into ${table} (ip_hash) values ('${A}')`), "permission denied"),
    true,
  );
  check(
    `${label} cannot change or delete rows`,
    [
      refused(await as(who, uid, `update ${table} set created_at = now()`), "permission denied"),
      refused(await as(who, uid, `delete from ${table}`), "permission denied"),
    ],
    [true, true],
  );
  check(
    `${label} cannot call the function`,
    refused(await as(who, uid, `select public.check_contact_rate('${B}')`), "permission denied"),
    true,
  );
}
check(
  "row-level security is on, so a stray grant would still show no rows",
  await db.query(`select relrowsecurity from pg_class where relname = '${table}'`).then((r) => r.rows),
  [{ relrowsecurity: true }],
);
check(
  "the table holds only hashes: no column for an address",
  await db
    .query(`select column_name from information_schema.columns where table_name = '${table}' order by 1`)
    .then((r) => r.rows.map((x) => x.column_name)),
  ["created_at", "id", "ip_hash"],
);

finish("contact rate limit");
