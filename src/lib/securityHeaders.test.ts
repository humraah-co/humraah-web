// The security headers sent on every page. Run with: npm run test:unit
import assert from "node:assert/strict";
import { test } from "node:test";
import { contentSecurityPolicy, securityHeaders } from "./securityHeaders.ts";

const supabaseUrl = "https://abcd1234.supabase.co";
const get = (headers: { key: string; value: string }[], key: string) =>
  headers.find((h) => h.key === key)?.value;

test("the basic headers are always sent", () => {
  for (const production of [true, false]) {
    const h = securityHeaders({ production, supabaseUrl });
    assert.equal(get(h, "X-Content-Type-Options"), "nosniff");
    assert.equal(get(h, "Referrer-Policy"), "strict-origin-when-cross-origin");
    assert.equal(get(h, "X-Frame-Options"), "DENY");
    const permissions = get(h, "Permissions-Policy")!;
    for (const feature of ["camera", "microphone", "geolocation", "payment", "usb"])
      assert.ok(permissions.includes(`${feature}=()`), feature);
  }
});

test("HSTS is sent in production only", () => {
  assert.match(get(securityHeaders({ production: true }), "Strict-Transport-Security")!, /^max-age=\d+$/);
  assert.equal(get(securityHeaders({ production: false }), "Strict-Transport-Security"), undefined);
});

test("the CSP is report-only until CSP_MODE=enforce", () => {
  const reporting = securityHeaders({ production: true, supabaseUrl });
  assert.ok(get(reporting, "Content-Security-Policy-Report-Only"));
  assert.equal(get(reporting, "Content-Security-Policy"), undefined);

  const enforcing = securityHeaders({ production: true, supabaseUrl, cspMode: "enforce" });
  assert.ok(get(enforcing, "Content-Security-Policy"));
  assert.equal(get(enforcing, "Content-Security-Policy-Report-Only"), undefined);
  assert.ok(get(enforcing, "Content-Security-Policy")!.endsWith("upgrade-insecure-requests"));
});

test("the CSP allows our own origin and Supabase, and nothing else outside", () => {
  const csp = contentSecurityPolicy({ production: true, supabaseUrl });
  assert.match(csp, /default-src 'self'(;|$)/);
  assert.match(csp, new RegExp(`connect-src 'self' ${supabaseUrl} wss://abcd1234.supabase.co(;|$)`));
  const outside = csp.match(/https?:\/\/[^\s;]+/g) ?? [];
  assert.deepEqual(outside, [supabaseUrl]);
  assert.ok(!/[\s]\*[\s;]|\s\*$/.test(csp), "no bare wildcard source");
  assert.match(csp, /frame-ancestors 'none'/);
  assert.match(csp, /object-src 'none'/);
});

test("scripts: inline allowed for Next's start-up code, but no eval and no hash in production", () => {
  const scripts = contentSecurityPolicy({ production: true, supabaseUrl }).match(/script-src ([^;]*)/)![1];
  assert.ok(scripts.includes("'unsafe-inline'"));
  assert.ok(!scripts.includes("'unsafe-eval'"));
  // A hash next to 'unsafe-inline' would make browsers ignore 'unsafe-inline'.
  assert.ok(!scripts.includes("sha256-"));
  assert.ok(!scripts.includes("nonce-"));
  const dev = contentSecurityPolicy({ production: false, supabaseUrl }).match(/script-src ([^;]*)/)![1];
  assert.ok(dev.includes("'unsafe-eval'"));
});

test("without a Supabase address, or with a bad one, only our own origin is allowed", () => {
  for (const url of [undefined, "", "not a url"]) {
    const csp = contentSecurityPolicy({ production: true, supabaseUrl: url });
    assert.match(csp, /connect-src 'self'(;|$)/);
  }
});
