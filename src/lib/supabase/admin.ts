import "server-only";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";
import { getSupabaseEnv } from "./env";

/**
 * Service-role client for the few things only Supabase Auth's admin API can
 * do: sending invites, deleting a revoked invitee's account and reading
 * when people last signed in, and the contact form's rate limit
 * (check_contact_rate, which only this role may run). It bypasses row-level security, so callers
 * must check the signed-in member's role first, and table changes still go
 * through the session client so the access rules and activity log apply.
 *
 * SUPABASE_SERVICE_ROLE_KEY has no NEXT_PUBLIC_ prefix and this module is
 * server-only, so the key never reaches the browser. Returns null when the
 * key isn't set.
 */
export function createAdminClient() {
  const env = getSupabaseEnv();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!env || !serviceRoleKey) return null;
  return createClient<Database>(env.url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}
