import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import type { Database } from "@/lib/database.types";
import {
  ACCEPT_INVITE_PATH,
  ADMIN_HOME,
  LOGIN_PATH,
  NO_ACCESS_PATH,
  isOpenAdminPath,
} from "@/lib/admin/paths";
import { KEEP_SIGNED_IN_COOKIE, sessionCookieOptions } from "@/lib/supabase/cookies";
import { getSupabaseEnv } from "@/lib/supabase/env";

/**
 * Guards the admin area (/admin/*) and keeps the session fresh. Signed out
 * → /admin/login. The session is checked with getClaims(), which verifies
 * the token locally, so a workspace page costs no round trip here.
 *
 * Membership (invited, suspended, no team_members row) is checked by every
 * workspace page and action on the server (requireActiveMember), with
 * row-level security underneath, so it isn't read again here for them. The
 * sign-in pages and No access act on it, so for those it's read here:
 *   suspended               → signed out, then /admin/login
 *   active on /admin/login  → /admin
 *   active on No access     → /admin
 *   invited on No access    → /admin/accept-invite
 */
export async function middleware(request: NextRequest) {
  const response = await guard(request);
  // Admin responses, redirects included, are for one person: never stored by a browser or shared cache.
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}

async function guard(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const open = isOpenAdminPath(pathname);
  const env = getSupabaseEnv();
  if (!env) return open ? NextResponse.next() : NextResponse.redirect(new URL(LOGIN_PATH, request.url));

  let response = NextResponse.next({ request });
  const keep = request.cookies.has(KEEP_SIGNED_IN_COOKIE);
  const supabase = createServerClient<Database>(env.url, env.anonKey, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (toSet, headers) => {
        toSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        toSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, sessionCookieOptions(options, keep)),
        );
        Object.entries(headers ?? {}).forEach(([key, value]) => response.headers.set(key, value));
      },
    },
  });

  // Carries any refreshed or cleared session cookies over to a redirect.
  const redirectTo = (to: string) => {
    const redirect = NextResponse.redirect(new URL(to, request.url));
    response.cookies.getAll().forEach((cookie) => redirect.cookies.set(cookie));
    response.headers.forEach((value, key) => {
      if (key === "cache-control" || key === "expires" || key === "pragma") redirect.headers.set(key, value);
    });
    return redirect;
  };

  const { data, error } = await supabase.auth.getClaims();
  const userId = error ? null : data?.claims.sub;

  if (!userId) {
    if (open) return response;
    const next = pathname === ADMIN_HOME ? "" : `?next=${encodeURIComponent(pathname + search)}`;
    return redirectTo(LOGIN_PATH + next);
  }

  // Workspace pages check the membership themselves (requireActiveMember).
  if (!open && pathname !== NO_ACCESS_PATH) return response;

  const { data: member } = await supabase
    .from("team_members")
    .select("status")
    .eq("user_id", userId)
    .maybeSingle();
  const status = member?.status;

  if (status === "suspended") {
    await supabase.auth.signOut();
    return open ? response : redirectTo(`${LOGIN_PATH}?notice=suspended`);
  }
  if (open) {
    // Already signed in: skip the sign-in page.
    return pathname === LOGIN_PATH && status === "active" ? redirectTo(ADMIN_HOME) : response;
  }
  if (status === "active") return pathname === NO_ACCESS_PATH ? redirectTo(ADMIN_HOME) : response;
  if (status === "invited") return redirectTo(ACCEPT_INVITE_PATH);
  return pathname === NO_ACCESS_PATH ? response : redirectTo(NO_ACCESS_PATH);
}

export const config = {
  matcher: ["/admin/:path*"],
};
