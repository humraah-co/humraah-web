// Site search: query cleaning, matching, grouping. Run with: npm run test:unit
import assert from "node:assert/strict";
import { test } from "node:test";
import {
  cleanQuery,
  matchesText,
  MAX_QUERY_LENGTH,
  PER_TYPE_LIMIT,
  queryWords,
  searchContent,
  searchPath,
  totalResults,
  type SearchData,
} from "./search.ts";

const nothing: SearchData = { universities: [], scholarships: [], fields: [], guidance: [], resources: [] };
// Only the fields search reads; the rest of each row is not needed here.
const data = (over: Record<string, unknown>) => ({ ...nothing, ...over }) as unknown as SearchData;
const uni = (id: string, name: string, city = "Lahore", programmes: string[] = []) => ({
  id,
  slug: id,
  name,
  short_name: null,
  city,
  campuses_note: null,
  province: "Punjab",
  programmes: programmes.map((p) => ({ name: p })),
  english: [],
});
const schol = (id: string, name: string, summary = "", covers: string[] = []) => ({
  id,
  slug: id,
  name,
  provider: "HEC",
  summary,
  audience_note: null,
  covers,
  eligible_areas: [],
  english: [],
});

test("cleanQuery trims, collapses spaces, drops control characters and cuts to 80 characters", () => {
  assert.equal(cleanQuery("  lahore \t  university\n"), "lahore university");
  assert.equal(cleanQuery("a\u0000b\u0007c"), "a b c");
  assert.equal(cleanQuery("x".repeat(500)).length, MAX_QUERY_LENGTH);
  assert.equal(cleanQuery(`${"x".repeat(79)} y`), "x".repeat(79));
  assert.equal(cleanQuery("😀".repeat(100)), "😀".repeat(MAX_QUERY_LENGTH));
  assert.equal(cleanQuery(["first", "second"]), "first");
  assert.equal(cleanQuery(undefined), "");
  assert.equal(cleanQuery(42), "");
  assert.equal(cleanQuery("   "), "");
});

test("the query is only ever compared as text, so quotes, wildcards and tags match literally", () => {
  const unis = [uni("a", "Name; DROP TABLE universities--"), uni("b", "Plain")];
  const content = data({ universities: unis });
  assert.equal(searchContent("drop table", content)[0].results.length, 1);
  assert.deepEqual(searchContent("'; drop table", content), []);
  assert.deepEqual(searchContent("%", content), []);
  assert.deepEqual(searchContent("<script>", content), []);
});

test("matching ignores case and needs every word, in any order", () => {
  const words = queryWords("COMPUTER science");
  assert.equal(matchesText(words, ["BSc Computer Science"]), true);
  assert.equal(matchesText(words, ["Science of the computer"]), true);
  assert.equal(matchesText(words, ["Computer"]), false);
  assert.equal(matchesText([], ["anything"]), false);
  assert.equal(matchesText(queryWords("اسلام آباد"), [null, "یونیورسٹی اسلام آباد"]), true);
});

test("results come back grouped by type, in a fixed order, with the item's own link", () => {
  const groups = searchContent(
    "engineering",
    data({
      universities: [uni("nust", "NUST", "Islamabad", ["Engineering"])],
      scholarships: [schol("hec", "HEC Engineering Award")],
      fields: [
        {
          id: "f1",
          slug: "engineering",
          name: "Engineering",
          summary: "Build things",
          you_might_enjoy: null,
          interests: [],
          example_programmes: [],
          english: [],
        },
      ],
      guidance: [{ id: "g1", slug: "pick", title: "Choosing", summary: "Engineering or not", english: [] }],
      resources: [
        {
          id: "r1",
          title: "Engineering council",
          description: null,
          url: "https://pec.org.pk",
          category: "official",
          english: [],
        },
      ],
    }),
  );
  assert.deepEqual(
    groups.map((g) => g.kind),
    ["universities", "scholarships", "fields", "guidance", "resources"],
  );
  assert.deepEqual(
    groups.map((g) => g.results[0].href),
    [
      "/universities/nust",
      "/scholarships/hec",
      "/explore/engineering",
      "/guidance/pick",
      "https://pec.org.pk",
    ],
  );
  assert.equal(groups[4].results[0].external, true);
  assert.equal(totalResults(groups), 5);
});

test("a search that only finds one type still gives that one group", () => {
  const groups = searchContent("lahore", data({ universities: [uni("a", "LUMS"), uni("b", "UET")] }));
  assert.equal(groups.length, 1);
  assert.equal(groups[0].kind, "universities");
});

test("title matches list before matches in other text", () => {
  const groups = searchContent(
    "medical",
    data({
      scholarships: [schol("a", "Aid fund", "for medical students"), schol("b", "Medical merit award")],
    }),
  );
  assert.deepEqual(
    groups[0].results.map((r) => r.id),
    ["b", "a"],
  );
});

test("each type shows at most ten results but reports the full count", () => {
  const many = Array.from({ length: 25 }, (_, i) => uni(`u${i}`, `College ${i}`));
  const [group] = searchContent("college", data({ universities: many }));
  assert.equal(group.results.length, PER_TYPE_LIMIT);
  assert.equal(group.total, 25);
});

test("an empty or blank query, and a query with no match, give no groups", () => {
  const content = data({ universities: [uni("a", "LUMS")] });
  assert.deepEqual(searchContent("", content), []);
  assert.deepEqual(searchContent("   ", content), []);
  assert.deepEqual(searchContent("zzzz", content), []);
  assert.deepEqual(searchContent("lums", nothing), []);
  // A loader that returned null (database not connected) is skipped, not an error.
  const unset = { universities: null, scholarships: null, fields: null, guidance: null, resources: null };
  assert.deepEqual(searchContent("lums", unset), []);
});

test("the search address keeps the cleaned query, and is null for an empty one", () => {
  assert.equal(searchPath("  law & order "), "/search?q=law%20%26%20order");
  assert.equal(searchPath("   "), null);
  assert.equal(searchPath("x".repeat(200)), `/search?q=${"x".repeat(MAX_QUERY_LENGTH)}`);
});
