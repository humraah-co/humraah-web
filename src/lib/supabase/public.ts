import "server-only";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";
import { getSupabaseEnv } from "./env";

/**
 * Read-only client for public pages. Uses the anon key with no user session,
 * so row-level security only ever returns published rows. Returns null when
 * the environment variables are not set (e.g. a fresh clone).
 */
export function createPublicClient() {
  const env = getSupabaseEnv();
  if (!env) return null;
  return createClient<Database>(env.url, env.anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
