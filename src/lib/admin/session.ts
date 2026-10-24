import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import type { TeamMember } from "@/lib/database.types";
import { getSupabaseEnv } from "@/lib/supabase/env";
import { createSessionClient } from "@/lib/supabase/server";
import { ACCEPT_INVITE_PATH, LOGIN_PATH, NO_ACCESS_PATH } from "./paths";

export type Member = Pick<TeamMember, "user_id" | "email" | "full_name" | "role" | "status">;

/**
 * The signed-in user and their team_members row, once per request.
 * Null when Supabase isn't configured.
 */
export const getAdminSession = cache(async () => {
  if (!getSupabaseEnv()) return null;
  const supabase = await createSessionClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { supabase, user: null, member: null };
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
