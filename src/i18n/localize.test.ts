// Urdu content with an English fallback (localize.ts).
// Run with: npm run test:i18n
import assert from "node:assert/strict";
import { test } from "node:test";
import { asEnglish, localize } from "./localize.ts";

const row = {
  id: "1",
  name: "Quaid-i-Azam University",
  name_ur: null as string | null,
  summary: "English summary",
  summary_ur: "اردو خلاصہ",
  overview: "English overview",
  overview_ur: "   ",
  covers: ["Tuition", "Stipend"],
  covers_ur: [] as string[],
  areas: ["STEM"],
  areas_ur: ["STEM", "صحت"],
  fee_note: null as string | null,
  fee_note_ur: null as string | null,
};

test("uses the Urdu where there is some", () => {
  const r = localize(row, ["summary", "areas"] as const);
  assert.equal(r.summary, "اردو خلاصہ");
  assert.deepEqual(r.areas, ["STEM", "صحت"]);
  assert.deepEqual(r.english, []);
});

test("falls back to English for empty, blank or missing Urdu, and lists those fields", () => {
  const r = localize(row, ["summary", "overview", "covers"] as const);
  assert.equal(r.overview, "English overview");
  assert.deepEqual(r.covers, ["Tuition", "Stipend"]);
  assert.deepEqual(r.english, ["overview", "covers"]);
});

test("text with no English either is not reported as English", () => {
  const r = localize(row, ["fee_note"] as const);
  assert.equal(r.fee_note, null);
  assert.deepEqual(r.english, []);
});

test("names switch to Urdu only when there is one, and are never reported", () => {
  const r = localize(row, ["summary"] as const, ["name"] as const);
  assert.equal(r.name, "Quaid-i-Azam University");
  assert.deepEqual(r.english, []);
  const named = localize({ ...row, name_ur: "قائداعظم یونیورسٹی" }, [] as const, ["name"] as const);
  assert.equal(named.name, "قائداعظم یونیورسٹی");
});

test("every _ur column is removed from the result, and the rest is kept", () => {
  const r = localize(row, ["summary"] as const);
  assert.deepEqual(
    Object.keys(r).filter((k) => k.endsWith("_ur")),
    [],
  );
  assert.equal(r.id, "1");
});

test("the result survives the data cache (JSON)", () => {
  const r = localize(row, ["summary", "overview"] as const);
  assert.deepEqual(JSON.parse(JSON.stringify(r)), r);
});

test("English pages mark nothing", () => {
  assert.deepEqual(asEnglish({ summary: "x" }).english, []);
});
