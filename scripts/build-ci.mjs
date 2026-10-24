// The CI build: `next build` with no Supabase settings, then a check that no
// /admin page was prerendered. Run with: npm run build:ci
//
// CI has no .env.local, so this is how the site must build there. Next
// doesn't replace a variable that's already set, so the empty values below
// win over a local .env.local, and the build sees no Supabase settings.
// Public pages must then show their "not connected" state; admin pages are
// per-person and must never be built ahead of time.
import { spawnSync } from "node:child_process";
import fs from "node:fs";

const blank = {
  NEXT_PUBLIC_SUPABASE_URL: "",
  NEXT_PUBLIC_SUPABASE_ANON_KEY: "",
  SUPABASE_SERVICE_ROLE_KEY: "",
};
const build = spawnSync("npx", ["next", "build"], {
  stdio: "inherit",
  env: { ...process.env, ...blank },
  shell: process.platform === "win32",
});
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
console.log("\nBuilt with no Supabase settings; no admin page was prerendered.");
