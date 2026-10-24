import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/lib/database.types";
import { getSupabaseEnv } from "./env";

/**
 * Browser client, used only to pick up the session from an invite link.
 * Invite emails can't use PKCE, so Supabase puts the tokens in the URL
 * fragment, which the server never sees. The page reads them itself
 * (detectSessionInUrl is off) and this client stores them as cookies.
 */
export function createBrowserSessionClient() {
  const env = getSupabaseEnv();
  if (!env) return null;
  return createBrowserClient<Database>(env.url, env.anonKey, {
    auth: { detectSessionInUrl: false },
  });
}
