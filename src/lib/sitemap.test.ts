// The sitemap and robots.txt rules. Run with: npm run test:unit
import assert from "node:assert/strict";
import { test } from "node:test";
import { isProductionDeployment, noindexHeaders, robotsFor, siteUrl } from "./indexing.ts";
import { buildSitemap, STATIC_PAGES } from "./sitemap.ts";

const site = "https://humraah.example";
const slugs = {
  universities: ["qau"],
  scholarships: ["hec-need-based"],
  fields: ["medicine"],
  guidance: ["how-to-apply"],
};

test("with Urdu on, every page is listed in both languages with hreflang alternates", () => {
  const entries = buildSitemap(site, slugs, true);
  assert.equal(entries.length, (STATIC_PAGES.length + 4) * 2);
  const en = entries.find((e) => e.url === `${site}/universities/qau`);
  const ur = entries.find((e) => e.url === `${site}/ur/universities/qau`);
  assert.ok(en && ur);
  const languages = {
    en: `${site}/universities/qau`,
    ur: `${site}/ur/universities/qau`,
    "x-default": `${site}/universities/qau`,
  };
  assert.deepEqual(en.alternates?.languages, languages);
  assert.deepEqual(ur.alternates?.languages, languages);
});

test("the home page is / in English and /ur in Urdu", () => {
  const urls = buildSitemap(site, slugs, true).map((e) => e.url);
  assert.ok(urls.includes(`${site}/`));
  assert.ok(urls.includes(`${site}/ur`));
});

test("with Urdu off, English only and no alternates", () => {
  const entries = buildSitemap(site, slugs, false);
  assert.equal(entries.length, STATIC_PAGES.length + 4);
  assert.ok(entries.every((e) => !e.url.includes("/ur") && !e.alternates));
});

test("only the entries it is given are listed; with none, only the fixed pages", () => {
  const entries = buildSitemap(site, { universities: [], scholarships: [], fields: [], guidance: [] }, false);
  assert.equal(entries.length, STATIC_PAGES.length);
  assert.ok(!entries.some((e) => /\/(universities|scholarships|explore|guidance)\//.test(e.url)));
});

test("admin, quiz results and the phone menu are never listed", () => {
  const urls = buildSitemap(site, slugs, true).map((e) => e.url);
  assert.ok(!urls.some((u) => u.includes("/admin") || u.includes("/results") || u.includes("/menu")));
});

test("the site address loses a trailing slash and defaults to localhost", () => {
  assert.equal(siteUrl("https://humraah.example/"), "https://humraah.example");
  assert.equal(siteUrl(undefined), "http://localhost:3000");
});

test("robots.txt: the live site blocks /admin and links the sitemap", () => {
  assert.deepEqual(robotsFor("production", site), {
    rules: { userAgent: "*", allow: "/", disallow: "/admin" },
    sitemap: `${site}/sitemap.xml`,
  });
});

test("robots.txt and noindex: everything else is kept out of search", () => {
  for (const env of ["preview", "development", undefined, "", "Production"]) {
    assert.deepEqual(robotsFor(env, site), { rules: { userAgent: "*", disallow: "/" } }, String(env));
    assert.equal(isProductionDeployment(env), false);
    assert.deepEqual(noindexHeaders(env), [{ key: "X-Robots-Tag", value: "noindex, nofollow" }]);
  }
  assert.deepEqual(noindexHeaders("production"), []);
});
