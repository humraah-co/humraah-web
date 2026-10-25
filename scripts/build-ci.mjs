// The CI build: `next build` with no Supabase settings and Urdu switched
// on, then checks on what was prerendered. Run with: npm run build:ci
//
// CI has no .env.local, so this is how the site must build there. Next
// doesn't replace a variable that's already set, so the empty values below
// win over a local .env.local, and the build sees no Supabase settings.
// Public pages must then show their "not connected" state; admin pages are
// per-person and must never be built ahead of time.
//
// Urdu is on (NEXT_PUBLIC_URDU_ENABLED=true) because that builds every
// route: the English pages and the Urdu ones. Both must be prerendered.
import { spawnSync } from "node:child_process";
import fs from "node:fs";

const blank = {
  NEXT_PUBLIC_SUPABASE_URL: "",
  NEXT_PUBLIC_SUPABASE_ANON_KEY: "",
  SUPABASE_SERVICE_ROLE_KEY: "",
  NEXT_PUBLIC_URDU_ENABLED: "true",
};
const build = spawnSync("npx", ["next", "build"], {
  stdio: "inherit",
  env: { ...process.env, ...blank },
  shell: process.platform === "win32",
});
// The data cache now holds "not connected" answers from this build; a later
// local `next build` with real settings would reuse them. Clear it.
fs.rmSync(".next/cache/fetch-cache", { recursive: true, force: true });
if (build.status !== 0) process.exit(build.status ?? 1);

const manifest = JSON.parse(fs.readFileSync(".next/prerender-manifest.json", "utf8"));
const prerendered = Object.keys(manifest.routes ?? {}).filter(
  (route) => route === "/admin" || route.startsWith("/admin/"),
);
if (prerendered.length) {
  console.error(
    `\nThese admin pages were prerendered, but they must render per request:\n  ${prerendered.join("\n  ")}`,
  );
  console.error('Check that src/app/admin/layout.tsx still has: export const dynamic = "force-dynamic"');
  process.exit(1);
}
// Pages that don't depend on the database, in both languages.
const expected = [
  "/en",
  "/ur",
  "/en/about",
  "/ur/about",
  "/en/guide",
  "/ur/guide",
  "/en/privacy",
  "/ur/privacy",
];
const missing = expected.filter((route) => !(route in (manifest.routes ?? {})));
if (missing.length) {
  console.error(`\nThese public pages should have been prerendered but weren't:\n  ${missing.join("\n  ")}`);
  process.exit(1);
}
console.log(
  "\nBuilt with no Supabase settings and Urdu on; English and Urdu pages were prerendered, no admin page was.",
);
