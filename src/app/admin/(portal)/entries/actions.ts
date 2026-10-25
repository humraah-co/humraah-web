"use server";

import { redirect } from "next/navigation";
import { entryTypes, isEntryTable, isUuid, type EntryTable } from "@/lib/admin/content";
import { formText } from "@/lib/admin/forms";
import { ADMIN_HOME } from "@/lib/admin/paths";
import { revalidateEntries } from "@/lib/admin/saveEntry";
import { requireActiveMember } from "@/lib/admin/session";
import { isAdminRole } from "@/lib/admin/team";

/*
 * Archive, restore and delete for universities and scholarships. Each
 * action re-reads the caller's membership and checks their role here; the
 * database checks again (only admins can restore or delete). Changes go
 * through the caller's own session, so the activity log records who did it.
 */

export type EntryActionError = "not-allowed" | "not-archived" | "archived" | "failed";

function back(table: EntryTable, id: string, params: Record<string, string>): never {
  redirect(`${entryTypes[table].adminPath}/${id}?${new URLSearchParams(params)}`);
}

/** The caller and the entry they want to act on, as it is now. */
async function callerAndEntry(form: FormData) {
  const { supabase, member } = await requireActiveMember();
  const table = formText(form, "table");
  const id = formText(form, "id");
  if (!isEntryTable(table) || !isUuid(id)) redirect(ADMIN_HOME);
  const { data: entry } = await supabase.from(table).select("id, name, status").eq("id", id).maybeSingle();
  if (!entry) redirect(entryTypes[table].adminPath);
  return { supabase, member, table, entry };
}

/** Anyone on the team. Takes the entry off the site; only an admin can bring it back. */
export async function archiveEntry(form: FormData) {
  const { supabase, table, entry } = await callerAndEntry(form);
  if (entry.status === "archived") back(table, entry.id, { error: "archived" });
  const { data, error } = await supabase
    .from(table)
    .update({ status: "archived" })
    .eq("id", entry.id)
    .neq("status", "archived")
    .select("id");
  if (error || !data?.length) back(table, entry.id, { error: error ? "failed" : "not-allowed" });
  revalidateEntries(table);
  back(table, entry.id, { notice: "archived" });
}

/** Admins and the owner: back to drafts, ready to check and publish again. */
export async function restoreEntry(form: FormData) {
  const { supabase, member, table, entry } = await callerAndEntry(form);
  if (!isAdminRole(member.role)) back(table, entry.id, { error: "not-allowed" });
  if (entry.status !== "archived") back(table, entry.id, { error: "not-archived" });
  const { data, error } = await supabase
    .from(table)
    .update({ status: "draft" })
    .eq("id", entry.id)
    .eq("status", "archived")
    .select("id");
  if (error || !data?.length) back(table, entry.id, { error: error ? "failed" : "not-allowed" });
  revalidateEntries(table);
  back(table, entry.id, { notice: "restored" });
}

/** "Ina's  University" and "ina's university" count as the same name. */
const sameName = (a: string, b: string) =>
  a.trim().replace(/\s+/g, " ").toLowerCase() === b.trim().replace(/\s+/g, " ").toLowerCase();

/**
 * Admins and the owner, archived entries only, after typing the entry's
 * name. Programmes and field-of-study links go with it.
 */
export async function deleteEntry(form: FormData) {
  const { supabase, member, table, entry } = await callerAndEntry(form);
  if (!isAdminRole(member.role)) back(table, entry.id, { error: "not-allowed" });
  if (entry.status !== "archived") back(table, entry.id, { error: "not-archived" });
  if (!sameName(formText(form, "confirm_name"), entry.name)) {
    back(table, entry.id, { confirm: "delete", error: "name" });
  }
  const { data, error } = await supabase.from(table).delete().eq("id", entry.id).select("id");
  if (error || !data?.length) back(table, entry.id, { error: error ? "failed" : "not-allowed" });
  revalidateEntries(table);
  redirect(`${entryTypes[table].adminPath}?${new URLSearchParams({ notice: "deleted", name: entry.name })}`);
}
