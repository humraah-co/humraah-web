/**
 * Validation for the contact form, shared by the server action and the
 * form. Limits match the checks on the contact_messages table.
 */

export const LIMITS = { name: 120, email: 254, message: 4000 } as const;

export type ContactField = "name" | "email" | "message" | "privacy";

/** What's wrong with a field; the form shows the matching message in the page's language ("contact.errors"). */
export type ContactError =
  | "nameRequired"
  | "nameTooLong"
  | "emailRequired"
  | "emailInvalid"
  | "messageRequired"
  | "messageTooLong"
  | "privacyRequired";

export type ContactInput = { name: string; email: string; message: string; privacy: boolean };

export type ContactState =
  | { status: "idle" }
  | {
      status: "invalid";
      errors: Partial<Record<ContactField, ContactError>>;
      values: Omit<ContactInput, "privacy">;
    }
  | { status: "error"; values: Omit<ContactInput, "privacy"> }
  | { status: "limited"; values: Omit<ContactInput, "privacy"> }
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
  const errors: Partial<Record<ContactField, ContactError>> = {};
  if (!input.name) errors.name = "nameRequired";
  else if (input.name.length > LIMITS.name) errors.name = "nameTooLong";

  if (!input.email) errors.email = "emailRequired";
  else if (input.email.length > LIMITS.email || !emailPattern.test(input.email))
    errors.email = "emailInvalid";

  if (!input.message) errors.message = "messageRequired";
  else if (input.message.length > LIMITS.message) errors.message = "messageTooLong";

  if (!input.privacy) errors.privacy = "privacyRequired";
  return errors;
}
