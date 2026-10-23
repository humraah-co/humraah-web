import "server-only";
import type { ActivityLogEntry, ContentStatus } from "@/lib/database.types";
import type { createSessionClient } from "@/lib/supabase/server";
import { scholarshipKindLabels, type EntryTable } from "./content";

type SessionClient = Awaited<ReturnType<typeof createSessionClient>>;

/**
 * Reads for the content lists and editors, as the signed-in member: team
 * members see drafts and archived entries too. Each returns null when the
 * query fails.
 */

export type EntryRow = {
  id: string;
  slug: string;
  name: string;
  /** "Islamabad, Public" or "Government, for women". */
  detail: string;
  /** Also matched by search, not shown: a university's short name ("NUST"), a scholarship's provider. */
  search: string | null;
  status: ContentStatus;
  last_verified_at: string | null;
  updated_at: string;
  updated_by: string | null;
};

/** Every entry in a table, newest change first. The tables are small, so lists filter in the page. */
export async function listEntries(supabase: SessionClient, table: EntryTable): Promise<EntryRow[] | null> {
  const common = "id, slug, name, status, last_verified_at, updated_at, updated_by";
  if (table === "universities") {
    const { data, error } = await supabase
      .from("universities")
      .select(`${common}, short_name, city, campuses_note, type`)
      .order("updated_at", { ascending: false });
    if (error) return null;
    return data.map(({ short_name, city, campuses_note, type, ...row }) => ({
      ...row,
      detail: [campuses_note ?? city, type === "public" ? "Public" : type === "private" ? "Private" : null]
        .filter(Boolean)
        .join(", "),
      search: short_name,
    }));
  }
  const { data, error } = await supabase
    .from("scholarships")
    .select(`${common}, provider, kind, women_only`)
    .order("updated_at", { ascending: false });
  if (error) return null;
  return data.map(({ provider, kind, women_only, ...row }) => ({
    ...row,
    detail: [scholarshipKindLabels[kind], women_only ? "for women" : null].filter(Boolean).join(", "),
    search: provider,
  }));
}

/** Names for the people who made changes: full name, else email. */
export async function teamNames(supabase: SessionClient) {
  const { data } = await supabase.from("team_members").select("user_id, full_name, email");
  return new Map((data ?? []).map((m) => [m.user_id, m.full_name || m.email]));
}

export async function getUniversityForEdit(supabase: SessionClient, id: string) {
  const [university, programmes] = await Promise.all([
    supabase.from("universities").select("*").eq("id", id).maybeSingle(),
    supabase
      .from("programmes")
      .select("id, field_id, name, level, entry_requirements, entry_test")
      .eq("university_id", id)
      .order("sort_order")
      .order("created_at"),
  ]);
  if (university.error || programmes.error) return null;
  if (!university.data) return undefined;
  return { university: university.data, programmes: programmes.data };
}

export async function getScholarshipForEdit(supabase: SessionClient, id: string) {
  const [scholarship, links] = await Promise.all([
    supabase.from("scholarships").select("*").eq("id", id).maybeSingle(),
    supabase.from("scholarship_fields").select("field_id").eq("scholarship_id", id),
  ]);
  if (scholarship.error || links.error) return null;
  if (!scholarship.data) return undefined;
  return { scholarship: scholarship.data, fieldIds: links.data.map((l) => l.field_id) };
}

/** Fields of study for the editors' choices, drafts included. */
export async function listFieldOptions(supabase: SessionClient) {
  const { data } = await supabase.from("fields").select("id, name").order("sort_order").order("name");
  return data ?? [];
}

/** The latest changes to one entry, for the editor's "Recent changes". */
export async function entryActivity(
  supabase: SessionClient,
  table: EntryTable,
  id: string,
  limit = 5,
): Promise<ActivityLogEntry[]> {
  const { data } = await supabase
    .from("activity_log")
    .select("*")
    .eq("entity_type", table)
    .eq("entity_id", id)
    .order("created_at", { ascending: false })
    .limit(limit);
  return data ?? [];
}

/** Whether another entry already uses this slug (the database checks again). */
export async function slugTaken(
  supabase: SessionClient,
  table: EntryTable,
  slug: string,
  exceptId: string | null,
) {
  let query = supabase.from(table).select("id").eq("slug", slug);
  if (exceptId) query = query.neq("id", exceptId);
  const { data } = await query.limit(1);
  return !!data?.length;
}
