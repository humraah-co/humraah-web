// The contact form's bot checks and the address hashing. Run with: npm run test:unit
import assert from "node:assert/strict";
import { test } from "node:test";
import { clientIp, hashIp, looksLikeBot, MIN_FILL_MS } from "./contactGuard.ts";

const form = (fields: Record<string, string>) => {
  const data = new FormData();
  for (const [key, value] of Object.entries(fields)) data.set(key, value);
  return data;
};

test("a person who took a while and left the hidden field empty is not a bot", () => {
  assert.equal(looksLikeBot(form({ website: "", elapsed: "45000" })), false);
  assert.equal(looksLikeBot(form({ elapsed: String(MIN_FILL_MS) })), false);
});

test("a filled-in hidden field is a bot", () => {
  assert.equal(looksLikeBot(form({ website: "http://spam.example", elapsed: "45000" })), true);
});

test("sending too fast, or with no timing at all, is a bot", () => {
  assert.equal(looksLikeBot(form({ elapsed: "400" })), true);
  assert.equal(looksLikeBot(form({ elapsed: String(MIN_FILL_MS - 1) })), true);
  assert.equal(looksLikeBot(form({})), true);
  assert.equal(looksLikeBot(form({ elapsed: "" })), true);
  assert.equal(looksLikeBot(form({ elapsed: "soon" })), true);
  assert.equal(looksLikeBot(form({ elapsed: "-5000" })), true);
});

test("an impossibly long time is made up", () => {
  assert.equal(looksLikeBot(form({ elapsed: String(1000 * 60 * 60 * 24 * 30) })), true);
});

test("the address comes from the first forwarded entry, else x-real-ip, else nothing", () => {
  assert.equal(clientIp(new Headers({ "x-forwarded-for": "203.0.113.9, 10.0.0.1" })), "203.0.113.9");
  assert.equal(clientIp(new Headers({ "x-real-ip": "198.51.100.4" })), "198.51.100.4");
  assert.equal(clientIp(new Headers()), null);
});

test("the hash is keyed, stable, and never contains the address", () => {
  const a = hashIp("203.0.113.9", "secret-one");
  assert.equal(a, hashIp("203.0.113.9", "secret-one"));
  assert.notEqual(a, hashIp("203.0.113.9", "secret-two"));
  assert.notEqual(a, hashIp("203.0.113.10", "secret-one"));
  assert.match(a!, /^[0-9a-f]{64}$/);
  assert.ok(!a!.includes("203"));
});

test("without a secret there is no hash, so nothing is stored", () => {
  assert.equal(hashIp("203.0.113.9", ""), null);
  assert.equal(hashIp("203.0.113.9", undefined), null);
});
