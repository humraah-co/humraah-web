import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import type { TeamMember } from "@/lib/database.types";
import { getSupabaseEnv } from "@/lib/supabase/env";
import { createSessionClient } from "@/lib/supabase/server";
import { ACCEPT_INVITE_PATH, LOGIN_PATH, NO_ACCESS_PATH } from "./paths";

export type Member = Pick<TeamMember, "user_id" | "email" | "full_name" | "role" | "status">;

/** Who the session belongs to, from its verified token. */
export type SessionUser = { id: string; email: string };

/**
 * The signed-in member's Supabase client, once per request. The layout,
 * the page and their queries share it.
 */
export const getSessionClient = cache(createSessionClient);

/**
 * The signed-in user and their team_members row, once per request (the
 * layout and the page share the result). Null when Supabase isn't
 * configured.
 *
 * getClaims() checks the session token's signature and expiry locally
 * against the project's published signing keys, so it costs no round trip
 * once those keys are cached. The member row is then read live, so a
 * suspension or role change counts straight away.
 */
export const getAdminSession = cache(async () => {
  if (!getSupabaseEnv()) return null;
  const supabase = await getSessionClient();
  const { data, error } = await supabase.auth.getClaims();
  const claims = error ? null : data?.claims;
  if (!claims?.sub) return { supabase, user: null, member: null };
  const user: SessionUser = { id: claims.sub, email: typeof claims.email === "string" ? claims.email : "" };
  const { data: member } = await supabase
    .from("team_members")
    .select("user_id, email, full_name, role, status")
    .eq("user_id", user.id)
    .maybeSingle();
  return { supabase, user, member: member as Member | null };
});

/**
 * For every admin page and team action, on top of the middleware: the
 * caller must be signed in with an active membership. Returns their row
 * as it is now, so role checks never rely on anything the browser sent.
 *
 * Pages may start their own queries at the same time (with
 * getSessionClient()), as long as they render nothing until this has
 * passed: row-level security limits what those queries can return, and a
 * redirect from here stops the page before anything is shown. Server
 * actions call this before they change anything.
 */
export async function requireActiveMember() {
  const session = await getAdminSession();
  if (!session?.user) redirect(LOGIN_PATH);
  const { supabase, user, member } = session;
  if (!member) redirect(NO_ACCESS_PATH);
  if (member.status === "invited") redirect(ACCEPT_INVITE_PATH);
  if (member.status === "suspended") {
    await supabase.auth.signOut();
    redirect(`${LOGIN_PATH}?notice=suspended`);
  }
  return { supabase, user, member };
}

export const canManageTeam = (member: Member) => member.role === "admin" || member.role === "owner";
