// Which deadlines the notifications bell lists and counts. Run with: npm run test:unit
import assert from "node:assert/strict";
import { test } from "node:test";
import {
  groupDeadlines,
  parseAdmissionDate,
  soonCount,
  toDeadlines,
  upcoming,
  type Deadline,
} from "./deadlines.ts";

// Noon in Pakistan on 1 March 2027.
const now = new Date("2027-03-01T07:00:00Z");

const d = (
  name: string,
  date: string,
  kind: Deadline["kind"] = "scholarship",
  verified = true,
): Deadline => ({
  kind,
  slug: name.toLowerCase().replace(/\W+/g, "-"),
  name,
  date,
  verified,
});

test("an admissions line gives a date only when it names a full day, month and year", () => {
  assert.equal(parseAdmissionDate("Applications close 30 April 2027"), "2027-04-30");
  assert.equal(parseAdmissionDate("Closes 30th Apr, 2027"), "2027-04-30");
  assert.equal(parseAdmissionDate("Deadline: April 30, 2027"), "2027-04-30");
  assert.equal(parseAdmissionDate("Last date 2027-04-30"), "2027-04-30");
  assert.equal(parseAdmissionDate("Sept 5 2027"), "2027-09-05");
});

test("with several dates in the line, the latest one is the closing date", () => {
  assert.equal(parseAdmissionDate("Opens 1 February 2027, closes 30 April 2027"), "2027-04-30");
  assert.equal(parseAdmissionDate("Closes 30 April 2027 (opened 1 Feb 2027)"), "2027-04-30");
});

test("vague, partial or impossible dates are not dates", () => {
  for (const text of [
    null,
    "",
    "Dates to be confirmed",
    "Spring and Fall intakes",
    "Applications open in April",
    "30 April",
    "April 2027",
    "31 February 2027",
    "Mayor 5 2027",
  ]) {
    assert.equal(parseAdmissionDate(text), null, String(text));
  }
});

test("scholarships use their deadline date; universities the date read from their admissions line", () => {
  const list = toDeadlines(
    [
      { slug: "a", name: "A", deadline: "2027-05-01", last_verified_at: "2027-01-01" },
      { slug: "b", name: "B", deadline: null, last_verified_at: null },
    ],
    [
      { slug: "u", name: "U", admissions_window: "Closes 30 April 2027", last_verified_at: null },
      { slug: "v", name: "V", admissions_window: "To be confirmed", last_verified_at: null },
      { slug: "w", name: "W", admissions_window: null, last_verified_at: null },
    ],
  );
  assert.deepEqual(
    list.map((x) => [x.kind, x.slug, x.date, x.verified]),
    [
      ["scholarship", "a", "2027-05-01", true],
      ["admission", "u", "2027-04-30", false],
    ],
  );
});

test("only deadlines that haven't passed are listed, soonest first; today still counts", () => {
  const list = upcoming(
    [
      d("Later", "2027-06-01"),
      d("Passed", "2027-02-28"),
      d("Today", "2027-03-01"),
      d("Sooner", "2027-03-15"),
    ],
    now,
  );
  assert.deepEqual(
    list.map((x) => x.name),
    ["Today", "Sooner", "Later"],
  );
});

test("the badge counts the next 30 days only", () => {
  const list = [
    d("Today", "2027-03-01"),
    d("Day 30", "2027-03-31"),
    d("Day 31", "2027-04-01"),
    d("Far", "2027-12-01"),
    d("Passed", "2027-02-01"),
  ];
  assert.equal(soonCount(list, now), 2);
  assert.equal(soonCount([], now), 0);
  assert.equal(soonCount([d("Far", "2027-12-01")], now), 0);
});

test("the panel groups scholarships before admissions and leaves out an empty group", () => {
  const both = groupDeadlines([d("U", "2027-04-01", "admission"), d("S", "2027-05-01", "scholarship")]);
  assert.deepEqual(
    both.map((g) => g.kind),
    ["scholarship", "admission"],
  );
  assert.deepEqual(
    groupDeadlines([d("U", "2027-04-01", "admission")]).map((g) => g.kind),
    ["admission"],
  );
  assert.deepEqual(groupDeadlines([]), []);
});
