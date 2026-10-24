/**
 * Validation for the admin sign-in, password and invite forms, shared by
 * the server actions and the forms.
 */

import { emailPattern } from "@/lib/contact";

export const PASSWORD_MIN = 8;
// Supabase Auth (bcrypt) only uses the first 72 characters.
export const PASSWORD_MAX = 72;
export const NAME_MAX = 120;
export const EMAIL_MAX = 254;

export function formText(form: FormData, key: string) {
  const value = form.get(key);
  return typeof value === "string" ? value.trim() : "";
}

/** Passwords are used exactly as typed, spaces included. */
export function formPassword(form: FormData, key: string) {
  const value = form.get(key);
  return typeof value === "string" ? value : "";
}

export function emailError(email: string) {
  if (!email) return "Please enter an email address.";
  if (email.length > EMAIL_MAX || !emailPattern.test(email))
    return "Please check the email address, for example name@example.com.";
}

export function nameError(name: string) {
  if (!name) return "Please enter a name.";
  if (name.length > NAME_MAX) return `Please keep the name under ${NAME_MAX} characters.`;
}

export function newPasswordErrors(password: string, confirm: string) {
  const errors: { password?: string; confirm?: string } = {};
  if (password.length < PASSWORD_MIN) errors.password = `Use at least ${PASSWORD_MIN} characters.`;
  else if (password.length > PASSWORD_MAX) errors.password = `Use ${PASSWORD_MAX} characters or fewer.`;
  else if (password !== confirm) errors.confirm = "The two passwords don’t match.";
  return errors;
}

/** Messages for Supabase Auth errors when setting a password. */
export function passwordUpdateMessage(code: string | undefined) {
  if (code === "same_password") return "That’s your current password. Please choose a new one.";
  if (code === "weak_password") return "That password is too easy to guess. Try a longer one.";
  return "We couldn’t save your password just now. Please try again.";
}
