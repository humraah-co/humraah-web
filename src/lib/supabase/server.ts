import "server-only";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import type { Database } from "@/lib/database.types";
import { getSupabaseEnv } from "./env";

/**
 * Session-aware client for the admin portal (Day 4+). Reads and refreshes the
 * signed-in team member's session from cookies; row-level security then
 * applies that member's role.
 */
export async function createSessionClient() {
  const env = getSupabaseEnv();
  if (!env) throw new Error("Supabase environment variables are not set");
  const cookieStore = await cookies();
  return createServerClient<Database>(env.url, env.anonKey, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (toSet) => {
        try {
          toSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Called from a Server Component: cookies are read-only there.
          // The middleware refreshes the session instead.
        }
      },
    },
  });
}
