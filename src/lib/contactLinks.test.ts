// The LinkedIn link: one shared address, used by the footer and the About
// page as a real link that opens in a new tab. Run with: npm run test:unit
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { contact } from "./nav.ts";

const read = (path: string) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

test("the LinkedIn address is the company page, kept next to Instagram and email", () => {
  assert.equal(contact.linkedinUrl, "https://www.linkedin.com/company/humraahco/");
  assert.ok(contact.instagramUrl && contact.email);
});

test("the footer and the About page link to it through the shared constant", () => {
  for (const file of ["components/layout/SiteFooter.tsx", "app/[locale]/about/page.tsx"]) {
    const source = read(file);
    assert.match(source, /href=\{contact\.linkedinUrl\}/, file);
    assert.match(source, /target="_blank"/, file);
    assert.match(source, /rel="noopener noreferrer"/, file);
    assert.match(source, /aria-label=\{common\("linkedinLabel"\)\}/, file);
  }
});

test("no page writes the LinkedIn address by hand", () => {
  for (const file of [
    "components/layout/SiteFooter.tsx",
    "app/[locale]/about/page.tsx",
    "components/ui/Blocks.tsx",
  ]) {
    assert.doesNotMatch(read(file), /linkedin\.com/, file);
  }
});

test("the link's label exists in both languages", () => {
  for (const lang of ["en", "ur"]) {
    assert.ok(JSON.parse(read(`messages/${lang}.json`)).common.linkedinLabel.length > 5);
  }
});
