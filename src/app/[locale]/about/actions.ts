"use server";

import { headers } from "next/headers";
import { readContactForm, validateContact, type ContactState } from "@/lib/contact";
import { clientIp, hashIp, looksLikeBot, RATE_LIMIT } from "@/lib/contactGuard";
import { createAdminClient } from "@/lib/supabase/admin";
import { createPublicClient } from "@/lib/supabase/public";

/**
 * Whether this sender may send another message now. Counted by a keyed hash
 * of their address (never the address itself) in Supabase, about five an
 * hour. If the check can't be made (no secret or key set, no address, the
 * database is down) the message is let through: losing a real message is
 * worse than letting one extra through.
 */
async function withinRateLimit() {
  const ip = clientIp(await headers());
  const hash = ip ? hashIp(ip) : null;
  const admin = createAdminClient();
  if (!hash || !admin) return true;
  const { data, error } = await admin.rpc("check_contact_rate", { p_ip_hash: hash, p_limit: RATE_LIMIT });
  if (error) {
    console.error("Contact rate limit not checked:", error.code, error.message);
    return true;
  }
  return data;
}

/**
 * Saves a contact message with the anon key. Row-level security lets anyone
 * insert into contact_messages but nobody except admins read it, so the
 * insert doesn't ask for the row back.
 */
export async function sendContactMessage(_prev: ContactState, form: FormData): Promise<ContactState> {
  // A hidden "website" field people never fill in, and a minimum time to fill
  // in the form. Bots fail one or the other. Pretend it worked, and save
  // nothing, so the bot learns nothing.
  if (looksLikeBot(form)) return { status: "sent" };

  const input = readContactForm(form);
  const values = { name: input.name, email: input.email, message: input.message };
  const errors = validateContact(input);
  if (Object.keys(errors).length > 0) return { status: "invalid", errors, values };

  // After validation, so a mistyped form doesn't use up one of the five.
  if (!(await withinRateLimit())) return { status: "limited", values };

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
