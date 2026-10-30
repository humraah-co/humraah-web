import "server-only";
import type { ActivityLogEntry, ContentStatus } from "@/lib/database.types";
import type { createSessionClient } from "@/lib/supabase/server";
import { fold, scholarshipKindLabels, type EntryTable } from "./content";
import { resourceCategoryLabels } from "./siteContent";
import { hostOf, readMinutes } from "@/lib/format";

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
  if (table === "scholarships") {
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
  if (table === "fields") {
    const { data, error } = await supabase
      .from("fields")
      .select(`${common}, example_programmes`)
      .order("updated_at", { ascending: false });
    if (error) return null;
    return data.map(({ example_programmes, ...row }) => ({
      ...row,
      detail: example_programmes.slice(0, 3).join(", "),
      search: example_programmes.join(" "),
    }));
  }
  if (table === "resources") {
    const { data, error } = await supabase
      .from("resources")
      .select("id, title, status, last_verified_at, updated_at, updated_by, url, category")
      .order("updated_at", { ascending: false });
    if (error) return null;
    return data.map(({ title, url, category, ...row }) => ({
      ...row,
      // A resource has no web address of its own: its link stands in for one.
      slug: url,
      name: title,
      detail: `${resourceCategoryLabels[category]}, ${hostOf(url)}`,
      search: url,
    }));
  }
  const { data, error } = await supabase
    .from("guidance_articles")
    .select("id, slug, title, status, last_verified_at, updated_at, updated_by, body_markdown")
    .order("updated_at", { ascending: false });
  if (error) return null;
  return data.map(({ title, body_markdown, ...row }) => ({
    ...row,
    name: title,
    detail: `${readMinutes(body_markdown)} min read`,
    search: null,
  }));
}

/** Entries whose name, web address, short name, provider or link contains the search text. */
export function searchEntries(rows: EntryRow[], q: string) {
  const query = fold(q.trim());
  if (!query) return rows;
  return rows.filter((r) => [r.name, r.slug, r.search ?? ""].some((text) => fold(text).includes(query)));
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
      // Every column, Urdu included; works the same before and after the Urdu migration.
      .select("*")
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

export async function getFieldForEdit(supabase: SessionClient, id: string) {
  const { data, error } = await supabase.from("fields").select("*").eq("id", id).maybeSingle();
  if (error) return null;
  return data ?? undefined;
}

export async function getResourceForEdit(supabase: SessionClient, id: string) {
  const { data, error } = await supabase.from("resources").select("*").eq("id", id).maybeSingle();
  if (error) return null;
  return data ?? undefined;
}

export async function getGuidanceForEdit(supabase: SessionClient, id: string) {
  const { data, error } = await supabase.from("guidance_articles").select("*").eq("id", id).maybeSingle();
  if (error) return null;
  return data ?? undefined;
}

/**
 * What would lose its link if this field of study were deleted: programmes
 * keep existing but have no field, and scholarships stop showing on its page.
 */
export async function fieldUsage(supabase: SessionClient, id: string) {
  const [programmes, scholarships] = await Promise.all([
    supabase.from("programmes").select("id", { count: "exact", head: true }).eq("field_id", id),
    supabase
      .from("scholarship_fields")
      .select("scholarship_id", { count: "exact", head: true })
      .eq("field_id", id),
  ]);
  return { programmes: programmes.count ?? 0, scholarships: scholarships.count ?? 0 };
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
  // Resources have no web address, so callers only ask about the other four.
  let query = supabase
    .from(table as Exclude<EntryTable, "resources">)
    .select("id")
    .eq("slug", slug);
  if (exceptId) query = query.neq("id", exceptId);
  const { data } = await query.limit(1);
  return !!data?.length;
}

/** Who last marked this entry as verified, from the activity log. */
export async function lastVerifier(supabase: SessionClient, table: EntryTable, id: string) {
  const { data } = await supabase
    .from("activity_log")
    .select("actor_id")
    .eq("entity_type", table)
    .eq("entity_id", id)
    .eq("action", "verified")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return data?.actor_id ?? null;
}
