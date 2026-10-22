"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { requestOrigin } from "@/lib/admin/origin";
import {
  emailError,
  formPassword,
  formText,
  nameError,
  newPasswordErrors,
  passwordUpdateMessage,
} from "@/lib/admin/forms";
import {
  ACCEPT_INVITE_PATH,
  ADMIN_HOME,
  AUTH_CONFIRM_PATH,
  LOGIN_PATH,
  NO_ACCESS_PATH,
  RESET_PASSWORD_PATH,
  safeNextPath,
} from "@/lib/admin/paths";
import { getAdminSession } from "@/lib/admin/session";
import { KEEP_SIGNED_IN_COOKIE, keepSignedInCookieOptions } from "@/lib/supabase/cookies";
import { getSupabaseEnv } from "@/lib/supabase/env";
import { createSessionClient } from "@/lib/supabase/server";

export type SignInState = { status: "idle" } | { status: "error"; message: string; email: string };

// The same message for a wrong password, an unknown email or a blocked
// account, so the form never reveals whether an email has an account.
const signInFailed = "That email and password don’t match. Check them and try again, or reset your password.";

export async function signIn(_prev: SignInState, form: FormData): Promise<SignInState> {
  const email = formText(form, "email");
  const password = formPassword(form, "password");
  const keep = form.get("keep") === "on";
  if (!email || !password) {
    return { status: "error", message: "Please enter your email address and password.", email };
  }
  if (!getSupabaseEnv()) {
    return { status: "error", message: "Sign-in isn’t available on this server yet.", email };
  }

  const cookieStore = await cookies();
  if (keep) cookieStore.set(KEEP_SIGNED_IN_COOKIE, "1", keepSignedInCookieOptions);
  else cookieStore.delete(KEEP_SIGNED_IN_COOKIE);

  const supabase = await createSessionClient({ keep });
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    const message =
      error.status === 429
        ? "Too many sign-in attempts. Please wait a few minutes and try again."
        : signInFailed;
    return { status: "error", message, email };
  }

  // Straight to the right page for their membership (the middleware would
  // get them there too, but the address bar would still say /admin).
  const { data: member } = await supabase
    .from("team_members")
    .select("status")
    .eq("user_id", data.user.id)
    .maybeSingle();
  if (member?.status === "suspended") {
    await supabase.auth.signOut();
    redirect(`${LOGIN_PATH}?notice=suspended`);
  }
  if (member?.status === "invited") redirect(ACCEPT_INVITE_PATH);
  if (!member) redirect(NO_ACCESS_PATH);
  redirect(safeNextPath(form.get("next")) ?? ADMIN_HOME);
}

export type ForgotState =
  { status: "idle" } | { status: "invalid"; message: string; email: string } | { status: "sent" };

export async function requestPasswordReset(_prev: ForgotState, form: FormData): Promise<ForgotState> {
  const email = formText(form, "email");
  const invalid = emailError(email);
  if (invalid) return { status: "invalid", message: invalid, email };

  if (getSupabaseEnv()) {
    const supabase = await createSessionClient();
    const redirectTo = `${await requestOrigin()}${AUTH_CONFIRM_PATH}?next=${encodeURIComponent(RESET_PASSWORD_PATH)}`;
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
    // Not shown to the person: the reply is the same whether or not the
    // email has an account (or the email couldn't be sent).
    if (error) console.error("Password reset email failed:", error.code ?? error.message);
  }
  return { status: "sent" };
}

export type NewPasswordState =
  { status: "idle" } | { status: "invalid"; errors: { password?: string; confirm?: string; form?: string } };

export async function setNewPassword(_prev: NewPasswordState, form: FormData): Promise<NewPasswordState> {
  const password = formPassword(form, "password");
  const errors = newPasswordErrors(password, formPassword(form, "confirm"));
  if (errors.password || errors.confirm) return { status: "invalid", errors };

  const supabase = await createSessionClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return {
      status: "invalid",
      errors: { form: "Your reset link has expired. Please ask for a new one." },
    };
  }
  const { error } = await supabase.auth.updateUser({ password });
  if (error) return { status: "invalid", errors: { form: passwordUpdateMessage(error.code) } };
  redirect(`${ADMIN_HOME}?notice=password-updated`);
}

export type AcceptInviteState =
  | { status: "idle" }
  | {
      status: "invalid";
      errors: { name?: string; password?: string; confirm?: string; form?: string };
      name: string;
    };

/** The last step of an invite: the person names themselves and chooses a password. */
export async function acceptInvite(_prev: AcceptInviteState, form: FormData): Promise<AcceptInviteState> {
  const name = formText(form, "name");
  const password = formPassword(form, "password");
  const errors = { name: nameError(name), ...newPasswordErrors(password, formPassword(form, "confirm")) };
  if (errors.name || errors.password || errors.confirm) return { status: "invalid", errors, name };

  const session = await getAdminSession();
  if (!session?.user || session.member?.status !== "invited") {
    return {
      status: "invalid",
      errors: { form: "This invite is no longer waiting to be accepted. Try signing in instead." },
      name,
    };
  }
  const { supabase } = session;
  const { error } = await supabase.auth.updateUser({ password, data: { full_name: name } });
  if (error) return { status: "invalid", errors: { form: passwordUpdateMessage(error.code) }, name };

  // Sets the name and makes the membership active (and logs "joined").
  const { error: acceptError } = await supabase.rpc("accept_invite", { p_full_name: name });
  if (acceptError) {
    console.error("accept_invite failed:", acceptError.message);
    return {
      status: "invalid",
      errors: {
        form: "Your password is saved, but we couldn’t finish setting up your account. Please try again.",
      },
      name,
    };
  }
  redirect(`${ADMIN_HOME}?notice=welcome`);
}
