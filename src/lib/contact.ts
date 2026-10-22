/**
 * Validation for the contact form, shared by the server action and the
 * form. Limits match the checks on the contact_messages table.
 */

export const LIMITS = { name: 120, email: 254, message: 4000 } as const;

export type ContactField = "name" | "email" | "message" | "privacy";

export type ContactInput = { name: string; email: string; message: string; privacy: boolean };

export type ContactState =
  | { status: "idle" }
  | {
      status: "invalid";
      errors: Partial<Record<ContactField, string>>;
      values: Omit<ContactInput, "privacy">;
    }
  | { status: "error"; values: Omit<ContactInput, "privacy"> }
  | { status: "sent" };

// Deliberately simple: something@something.something with no spaces.
export const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function readContactForm(form: FormData): ContactInput {
  const text = (key: string) => {
    const value = form.get(key);
    return typeof value === "string" ? value.trim() : "";
  };
  return {
    name: text("name"),
    email: text("email"),
    message: text("message"),
    privacy: form.get("privacy") === "on",
  };
}

export function validateContact(input: ContactInput) {
  const errors: Partial<Record<ContactField, string>> = {};
  if (!input.name) errors.name = "Please tell us your name.";
  else if (input.name.length > LIMITS.name)
    errors.name = `Please keep your name under ${LIMITS.name} characters.`;

  if (!input.email) errors.email = "Please add your email address so we can reply.";
  else if (input.email.length > LIMITS.email || !emailPattern.test(input.email))
    errors.email = "Please check your email address, for example name@example.com.";

  if (!input.message) errors.message = "Please write your message.";
  else if (input.message.length > LIMITS.message)
    errors.message = `Please keep your message under ${LIMITS.message.toLocaleString("en")} characters.`;

  if (!input.privacy) errors.privacy = "Please confirm you have read the Contact Form Privacy Notice.";
  return errors;
}
