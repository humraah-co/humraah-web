// The permanent redirects for merged pages. Run with: npm run test:unit
import assert from "node:assert/strict";
import { test } from "node:test";
import { MOVED_ADMIN_PAGES, MOVED_PAGES, redirects } from "./redirects.ts";

test("the old Guide and Resources pages redirect to their part of Guidance, in both languages", () => {
  const list = redirects();
  const find = (source: string) => list.find((r) => r.source === source);
  assert.equal(find("/guide")?.destination, "/guidance#guide");
  assert.equal(find("/ur/guide")?.destination, "/ur/guidance#guide");
  assert.equal(find("/resources")?.destination, "/guidance#resources");
  assert.equal(find("/ur/resources")?.destination, "/ur/guidance#resources");
});

test("every redirect is permanent and never points at itself", () => {
  for (const r of redirects()) {
    assert.equal(r.permanent, true);
    assert.notEqual(r.source, r.destination.split("#")[0]);
  }
});

test("a moved address never redirects to another moved address (no chains)", () => {
  const sources = new Set(redirects().map((r) => r.source));
  for (const r of redirects()) assert.ok(!sources.has(r.destination.split("#")[0]), r.destination);
  assert.ok(Object.keys(MOVED_PAGES).length > 0);
});

test("the old admin Resources addresses redirect to Guidance and resources", () => {
  const list = redirects();
  const find = (source: string) => list.find((r) => r.source === source);
  assert.equal(find("/admin/resources")?.destination, "/admin/guidance?type=resources");
  assert.equal(find("/admin/resources/:path*")?.destination, "/admin/guidance/resources/:path*");
  assert.ok(MOVED_ADMIN_PAGES.length === 2);
});
