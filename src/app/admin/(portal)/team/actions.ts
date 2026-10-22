"use server";

import { redirect } from "next/navigation";
import { emailError, formText, nameError } from "@/lib/admin/forms";
import { requestOrigin } from "@/lib/admin/origin";
import { ACCEPT_INVITE_PATH } from "@/lib/admin/paths";
import { requireActiveMember } from "@/lib/admin/session";
import { canManage, invitableRoles } from "@/lib/admin/team";
import type { TeamRole } from "@/lib/database.types";
import { createAdminClient } from "@/lib/supabase/admin";
import { createPublicClient } from "@/lib/supabase/public";

/*
 * Team actions. Each one re-reads the caller's membership on the server and
 * checks their role before doing anything; the database checks again
 * (row-level security and the team trigger). Table changes use the
 * caller's own session, so the activity log records who did what. The
 * service-role client is only used for Supabase Auth's admin API.
 */

const TEAM_PATH = "/admin/team";
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type TeamError =
  "not-allowed" | "not-pending" | "not-found" | "no-service-key" | "rate-limit" | "failed";
export type TeamNotice = "invited" | "resent" | "revoked" | "suspended" | "reactivated";

function backToTeam(params: { notice?: TeamNotice; error?: TeamError; id?: string }): never {
  const query = new URLSearchParams(Object.entries(params).filter(([, v]) => v) as [string, string][]);
  redirect(`${TEAM_PATH}?${query}`);
}

const isRateLimited = (error: { status?: number; code?: string }) =>
  error.status === 429 || error.code === "over_email_send_rate_limit";

/** The caller and the member they want to act on, or a redirect with the reason it isn't allowed. */
async function callerAndTarget(form: FormData) {
  const { supabase, member } = await requireActiveMember();
  const id = formText(form, "user_id");
  if (!uuidPattern.test(id)) backToTeam({ error: "not-found" });
  const { data: target } = await supabase
    .from("team_members")
    .select("user_id, email, full_name, role, status")
    .eq("user_id", id)
    .maybeSingle();
  if (!target) backToTeam({ error: "not-found" });
  if (!canManage(member, target)) backToTeam({ error: "not-allowed" });
  return { supabase, member, target };
}

export type InviteState =
  | { status: "idle" }
  | {
      status: "invalid";
      errors: { email?: string; name?: string; role?: string; form?: string };
      values: { email: string; name: string; role: string };
    };

export async function inviteMember(_prev: InviteState, form: FormData): Promise<InviteState> {
  const { supabase, member } = await requireActiveMember();
  const allowed = invitableRoles(member);
  const values = {
    email: formText(form, "email").toLowerCase(),
    name: formText(form, "name"),
    role: formText(form, "role") || "researcher",
  };
  const fail = (errors: Extract<InviteState, { status: "invalid" }>["errors"]): InviteState => ({
    status: "invalid",
    errors,
    values,
  });
  if (!allowed.length) return fail({ form: "Only admins can invite people." });

  const errors = {
    email: emailError(values.email),
    name: nameError(values.name),
    role: allowed.includes(values.role as TeamRole)
      ? undefined
      : member.role === "owner"
        ? "Please choose a role."
        : "Only the owner can invite admins.",
  };
  if (errors.email || errors.name || errors.role) return fail(errors);
  const role = values.role as TeamRole;

  const { data: existing } = await supabase
    .from("team_members")
    .select("status")
    .eq("email", values.email)
    .maybeSingle();
  if (existing) {
    return fail({
      email:
        existing.status === "invited"
          ? "This person already has an invite waiting. You can resend it from the list."
          : "This person is already on the team.",
    });
  }

  const admin = createAdminClient();
  if (!admin)
    return fail({ form: "Invites aren’t set up on this server yet: SUPABASE_SERVICE_ROLE_KEY is missing." });

  const redirectTo = `${await requestOrigin()}${ACCEPT_INVITE_PATH}`;
  const { data: invited, error } = await admin.auth.admin.inviteUserByEmail(values.email, {
    redirectTo,
    data: { full_name: values.name },
  });
  if (error || !invited.user) {
    if (error && isRateLimited(error)) {
      return fail({ form: "Supabase’s limit on emails has been reached. Please try again in an hour." });
    }
    if (error?.code === "email_exists") {
      return fail({
        email:
          "This email already has a Humraah account that isn’t on the team. The owner can remove it in Supabase (Authentication → Users) and then invite again.",
      });
    }
    console.error("Invite failed:", error?.code ?? error?.message);
    return fail({ form: "We couldn’t send the invite just now. Please try again." });
  }

  // As the caller, so the access rules and the "invited" log entry apply.
  const { error: insertError } = await supabase.from("team_members").insert({
    user_id: invited.user.id,
    email: values.email,
    full_name: values.name,
    role,
    status: "invited",
    invited_by: member.user_id,
  });
  if (insertError) {
    console.error("Adding the invited member failed:", insertError.message);
    // Don't leave a working invite link behind for someone who isn't on the team.
    await admin.auth.admin.deleteUser(invited.user.id);
    return fail({ form: "We couldn’t add them to the team. The invite was cancelled; please try again." });
  }
  backToTeam({ notice: "invited", id: invited.user.id });
}

export async function resendInvite(form: FormData) {
  const { supabase, target } = await callerAndTarget(form);
  if (target.status !== "invited") backToTeam({ error: "not-pending" });
  const admin = createAdminClient();
  if (!admin) backToTeam({ error: "no-service-key" });

  const redirectTo = `${await requestOrigin()}${ACCEPT_INVITE_PATH}`;
  let { error } = await admin.auth.admin.inviteUserByEmail(target.email, { redirectTo });
  if (error?.code === "email_exists") {
    // They opened the first link but never finished, so Supabase won't send
    // another invite. A sign-in link to the same page does the same job.
    const anon = createPublicClient();
    error = anon ? (await anon.auth.resetPasswordForEmail(target.email, { redirectTo })).error : error;
  }
  if (error) {
    console.error("Resending the invite failed:", error.code ?? error.message);
    backToTeam({ error: isRateLimited(error) ? "rate-limit" : "failed" });
  }

  const { error: logError } = await supabase.rpc("record_invite_resent", { p_user_id: target.user_id });
  if (logError) console.error("Logging the resent invite failed:", logError.message);
  backToTeam({ notice: "resent", id: target.user_id });
}

export async function revokeInvite(form: FormData) {
  const { supabase, target } = await callerAndTarget(form);
  if (target.status !== "invited") backToTeam({ error: "not-pending" });

  const { data: removed, error } = await supabase
    .from("team_members")
    .delete()
    .eq("user_id", target.user_id)
    .eq("status", "invited")
    .select("user_id");
  if (error || !removed?.length) backToTeam({ error: error ? "failed" : "not-allowed" });

  // Removing their Auth account makes the emailed link stop working.
  const admin = createAdminClient();
  const deleted = admin ? await admin.auth.admin.deleteUser(target.user_id) : null;
  if (!deleted || deleted.error) {
    console.error(
      "Deleting the revoked invitee's account failed:",
      deleted?.error?.message ?? "no service key",
    );
  }
  backToTeam({ notice: "revoked" });
}

async function setStatus(form: FormData, from: "active" | "suspended", to: "active" | "suspended") {
  const { supabase, target } = await callerAndTarget(form);
  if (target.status !== from) backToTeam({ error: "failed" });
  const { data: updated, error } = await supabase
    .from("team_members")
    .update({ status: to })
    .eq("user_id", target.user_id)
    .eq("status", from)
    .select("user_id");
  if (error || !updated?.length) backToTeam({ error: error ? "failed" : "not-allowed" });
  backToTeam({ notice: to === "suspended" ? "suspended" : "reactivated", id: target.user_id });
}

/** Suspended people are signed out by the middleware on their next request, and RLS stops their access at once. */
export async function suspendMember(form: FormData) {
  await setStatus(form, "active", "suspended");
}

export async function reactivateMember(form: FormData) {
  await setStatus(form, "suspended", "active");
}
