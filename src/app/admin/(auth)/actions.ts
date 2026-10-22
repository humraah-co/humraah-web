"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { requestOrigin } from "@/lib/admin/origin";
import {
  emailError,
  formPassword,
  formText,
  newPasswordErrors,
  passwordUpdateMessage,
} from "@/lib/admin/forms";
import { ADMIN_HOME, AUTH_CONFIRM_PATH, RESET_PASSWORD_PATH, safeNextPath } from "@/lib/admin/paths";
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
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    const message =
      error.status === 429
        ? "Too many sign-in attempts. Please wait a few minutes and try again."
        : signInFailed;
    return { status: "error", message, email };
  }
  // The middleware sends people without an active membership on from here.
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
