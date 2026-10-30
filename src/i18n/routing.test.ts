// Language routing rules (decide.ts) and the Urdu flag (config.ts).
// Run with: npm run test:i18n
import assert from "node:assert/strict";
import { test } from "node:test";
import { enabledLocales, isEnabledLocale, localizedPath, stripLocale, urduEnabled } from "./config.ts";
import { decideLocaleRoute } from "./decide.ts";

const browser = "Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 Chrome/130 Mobile Safari/537.36";
const route = (
  pathname: string,
  opts: { search?: string; cookie?: string; ua?: string; enabled?: boolean } = {},
) =>
  decideLocaleRoute({
    pathname,
    search: opts.search ?? "",
    cookie: opts.cookie,
    userAgent: opts.ua ?? browser,
    enabled: opts.enabled ?? true,
  });

test("English addresses open in English, even with the Urdu cookie", () => {
  assert.deepEqual(route("/universities/qau", { cookie: "ur" }), {
    kind: "rewrite",
    to: "/en/universities/qau",
  });
  assert.deepEqual(route("/scholarships", { search: "?scope=pakistan", cookie: "ur" }), {
    kind: "rewrite",
    to: "/en/scholarships?scope=pakistan",
  });
});

test("Urdu addresses open in Urdu, even with the English cookie, and remember Urdu", () => {
  assert.deepEqual(route("/ur/universities/qau", { cookie: "en" }), { kind: "next", setCookie: "ur" });
  assert.deepEqual(route("/ur"), { kind: "next", setCookie: "ur" });
  assert.deepEqual(route("/ur/about", { cookie: "ur" }), { kind: "next" });
});

test("only the home page follows the Urdu cookie", () => {
  assert.deepEqual(route("/", { cookie: "ur" }), { kind: "redirect", to: "/ur" });
  assert.deepEqual(route("/", { cookie: "ur", search: "?utm_source=x" }), {
    kind: "redirect",
    to: "/ur?utm_source=x",
  });
  assert.deepEqual(route("/", { cookie: "en" }), { kind: "rewrite", to: "/en" });
  assert.deepEqual(route("/"), { kind: "rewrite", to: "/en" });
  assert.equal(route("/about", { cookie: "ur" }).kind, "rewrite");
});

test("crawlers are never redirected", () => {
  for (const ua of [
    "Googlebot/2.1",
    "Mozilla/5.0 (compatible; bingbot/2.0)",
    "WhatsApp/2.23",
    "facebookexternalhit/1.1",
  ]) {
    assert.deepEqual(route("/", { cookie: "ur", ua }), { kind: "rewrite", to: "/en" }, ua);
  }
});

test("?lang=en remembers English and returns to the clean address", () => {
  assert.deepEqual(route("/universities/qau", { search: "?lang=en" }), {
    kind: "redirect",
    to: "/universities/qau",
    setCookie: "en",
  });
  assert.deepEqual(route("/ur/universities", { search: "?lang=en&city=Lahore" }), {
    kind: "redirect",
    to: "/universities?city=Lahore",
    setCookie: "en",
  });
  assert.deepEqual(route("/ur", { search: "?lang=en", cookie: "ur" }), {
    kind: "redirect",
    to: "/",
    setCookie: "en",
  });
});

test("the admin area is left to its own guard", () => {
  assert.deepEqual(route("/admin"), { kind: "admin" });
  assert.deepEqual(route("/admin/universities", { cookie: "ur" }), { kind: "admin" });
  assert.deepEqual(route("/admin/login", { search: "?lang=en" }), { kind: "admin" });
});

test("the internal /en address is served as it is, so a rewrite never loops", () => {
  assert.deepEqual(route("/en/universities"), { kind: "next" });
  assert.deepEqual(route("/en"), { kind: "next" });
  // Words that only start with "en" are ordinary pages.
  assert.equal(route("/explore/engineering").kind, "rewrite");
});

test("with the flag off, /ur is not a language: it falls through to the English 404", () => {
  assert.deepEqual(route("/ur/universities", { enabled: false }), {
    kind: "rewrite",
    to: "/en/ur/universities",
  });
  assert.deepEqual(route("/", { cookie: "ur", enabled: false }), { kind: "rewrite", to: "/en" });
});

test('the flag: only the literal "true" switches Urdu on', () => {
  assert.equal(urduEnabled("true"), true);
  for (const value of [undefined, "", "false", "1", "TRUE", "yes"])
    assert.equal(urduEnabled(value), false, String(value));
  assert.deepEqual(enabledLocales(false), ["en"]);
  assert.deepEqual(enabledLocales(true), ["en", "ur"]);
  assert.equal(isEnabledLocale("ur", false), false);
  assert.equal(isEnabledLocale("ur", true), true);
  assert.equal(isEnabledLocale("fr", true), false);
});

test("addresses convert between languages", () => {
  assert.equal(stripLocale("/ur/universities/qau"), "/universities/qau");
  assert.equal(stripLocale("/ur"), "/");
  assert.equal(stripLocale("/en/quiz"), "/quiz");
  assert.equal(stripLocale("/universities"), "/universities");
  assert.equal(stripLocale("/urdu-guide"), "/urdu-guide");
  assert.equal(localizedPath("/universities", "ur"), "/ur/universities");
  assert.equal(localizedPath("/", "ur"), "/ur");
  assert.equal(localizedPath("/ur/universities", "en"), "/universities");
});
