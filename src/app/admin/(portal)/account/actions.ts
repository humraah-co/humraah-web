"use server";

import { formPassword, newPasswordErrors, passwordUpdateMessage } from "@/lib/admin/forms";
import { requireActiveMember } from "@/lib/admin/session";

export type ChangePasswordState =
  | { status: "idle" }
  | { status: "saved" }
  | { status: "invalid"; errors: { password?: string; confirm?: string; form?: string } };

/** Sets a new password for the signed-in person, and only for them. Shared by every role. */
export async function changePassword(
  _prev: ChangePasswordState,
  form: FormData,
): Promise<ChangePasswordState> {
  const { supabase } = await requireActiveMember();
  const password = formPassword(form, "password");
  const errors = newPasswordErrors(password, formPassword(form, "confirm"));
  if (errors.password || errors.confirm) return { status: "invalid", errors };

  const { error } = await supabase.auth.updateUser({ password });
  if (error) return { status: "invalid", errors: { form: passwordUpdateMessage(error.code) } };
  return { status: "saved" };
}
