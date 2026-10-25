"use server";

import { readContactForm, validateContact, type ContactState } from "@/lib/contact";
import { createPublicClient } from "@/lib/supabase/public";

/**
 * Saves a contact message with the anon key. Row-level security lets anyone
 * insert into contact_messages but nobody except admins read it, so the
 * insert doesn't ask for the row back.
 */
export async function sendContactMessage(_prev: ContactState, form: FormData): Promise<ContactState> {
  // Hidden "website" field: people never fill it in, simple bots often do.
  // Pretend it worked so the bot learns nothing.
  if (typeof form.get("website") === "string" && form.get("website") !== "") return { status: "sent" };

  const input = readContactForm(form);
  const values = { name: input.name, email: input.email, message: input.message };
  const errors = validateContact(input);
  if (Object.keys(errors).length > 0) return { status: "invalid", errors, values };

  const supabase = createPublicClient();
  if (!supabase) return { status: "error", values };
  const { error } = await supabase
    .from("contact_messages")
    .insert({ name: input.name, email: input.email, message: input.message });
  if (error) {
    // Log the failure without the sender's details.
    console.error("Contact message not saved:", error.code, error.message);
    return { status: "error", values };
  }
  return { status: "sent" };
}
