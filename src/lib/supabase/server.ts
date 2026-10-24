import "server-only";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import type { Database } from "@/lib/database.types";
import { KEEP_SIGNED_IN_COOKIE, sessionCookieOptions } from "./cookies";
import { getSupabaseEnv } from "./env";

/**
 * Session-aware client for the admin portal. Reads and refreshes the
 * signed-in team member's session from cookies; row-level security then
 * applies that member's role.
 *
 * `keep` overrides the "Keep me signed in" choice; the sign-in action passes
 * it because the choice is made in the same request.
 */
export async function createSessionClient({ keep }: { keep?: boolean } = {}) {
  const env = getSupabaseEnv();
  if (!env) throw new Error("Supabase environment variables are not set");
  const cookieStore = await cookies();
  const keepSignedIn = keep ?? cookieStore.has(KEEP_SIGNED_IN_COOKIE);
  return createServerClient<Database>(env.url, env.anonKey, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (toSet) => {
        try {
          toSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, sessionCookieOptions(options, keepSignedIn)),
          );
        } catch {
          // Called from a Server Component: cookies are read-only there.
          // The middleware refreshes the session instead.
        }
      },
    },
  });
}
