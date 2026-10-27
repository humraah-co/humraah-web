"use server";

import { redirect } from "next/navigation";
import { isUuid } from "@/lib/admin/content";
import { formText } from "@/lib/admin/forms";
import { requireActiveMember } from "@/lib/admin/session";
import { isAdminRole } from "@/lib/admin/team";

/*
 * Marking a message read or unread, and archiving it or taking it out of the
 * archive. Contact messages hold visitors' personal details, so each action
 * re-reads the caller's membership and refuses anyone but an admin or the
 * owner; the database refuses them too (row-level security), and the time
 * and the person are stamped there, not taken from the form. Nothing here
 * reads, logs or sends the message itself.
 */

const LIST = "/admin/messages";

type Change = { read_at?: string | null; archived_at?: string | null };

async function change(form: FormData, patch: Change, notice: string): Promise<never> {
  const { supabase, member } = await requireActiveMember();
  const id = formText(form, "id");
  if (!isAdminRole(member.role) || !isUuid(id)) redirect(LIST);
  const { data, error } = await supabase.from("contact_messages").update(patch).eq("id", id).select("id");
  if (error) console.error("Updating a message failed:", error.code);
  if (error || !data?.length) redirect(`${LIST}/${id}?error=failed`);
  redirect(`${LIST}/${id}?notice=${notice}`);
}

export async function markMessageRead(form: FormData) {
  return change(form, { read_at: new Date().toISOString() }, "read");
}

export async function markMessageUnread(form: FormData) {
  return change(form, { read_at: null }, "unread");
}

export async function archiveMessage(form: FormData) {
  return change(form, { archived_at: new Date().toISOString() }, "archived");
}

export async function unarchiveMessage(form: FormData) {
  return change(form, { archived_at: null }, "unarchived");
}
