import "server-only";
import type { ActivityLogEntry } from "@/lib/database.types";
import type { createSessionClient } from "@/lib/supabase/server";
import { entryTypes, isUuid, type EntryTable } from "./content";

type SessionClient = Awaited<ReturnType<typeof createSessionClient>>;

/** The activity log's filters (Figma 36:4479 plus person, action and dates), all kept in the address. */

export const ACTIVITY_PAGE_SIZE = 50;

export const entityFilters = [
  { value: "universities", label: "Universities" },
  { value: "scholarships", label: "Scholarships" },
  { value: "resources", label: "Resources" },
  { value: "fields", label: "Fields of study" },
  { value: "guidance_articles", label: "Guidance" },
  { value: "team_members", label: "Team" },
] as const;

/** Each choice covers the matching content and team actions in the log. */
export const actionFilters = [
  { value: "added", label: "Added", actions: ["created", "added"] },
  { value: "updated", label: "Updated", actions: ["updated", "role_changed"] },
  { value: "verified", label: "Verified", actions: ["verified"] },
  { value: "published", label: "Published", actions: ["published"] },
  { value: "unpublished", label: "Moved to drafts", actions: ["draft"] },
  { value: "archived", label: "Archived", actions: ["archived"] },
  { value: "restored", label: "Restored", actions: ["restored"] },
  { value: "deleted", label: "Deleted", actions: ["deleted", "removed"] },
] as const;

export type ActivityFilters = {
  type: string;
  person: string;
  action: string;
  from: string;
  to: string;
  page: number;
};

const one = (value: string | string[] | undefined) => (typeof value === "string" ? value.trim() : "");
const datePattern = /^\d{4}-\d{2}-\d{2}$/;
const validDate = (value: string) => datePattern.test(value) && !Number.isNaN(Date.parse(value));

/** Reads the filters from the address, dropping anything that isn't a real choice. */
export function readActivityFilters(raw: Record<string, string | string[] | undefined>): ActivityFilters {
  const type = one(raw.type);
  const person = one(raw.person);
  const action = one(raw.action);
  const from = one(raw.from);
  const to = one(raw.to);
  const page = Number.parseInt(one(raw.page), 10);
  return {
    type: entityFilters.some((f) => f.value === type) ? type : "",
    person: person === "system" || isUuid(person) ? person : "",
    action: actionFilters.some((f) => f.value === action) ? action : "",
    from: validDate(from) ? from : "",
    to: validDate(to) ? to : "",
    page: Number.isFinite(page) && page > 1 ? page : 1,
  };
}

export function activityHref(filters: Partial<ActivityFilters>) {
  const query = new URLSearchParams();
  for (const key of ["type", "person", "action", "from", "to"] as const) {
    if (filters[key]) query.set(key, filters[key]);
  }
  if (filters.page && filters.page > 1) query.set("page", String(filters.page));
  const s = query.toString();
  return s ? `/admin/activity?${s}` : "/admin/activity";
}

/** Midnight in Pakistan at the start of `date`, `days` later. */
function pakistanMidnight(date: string, days = 0) {
  return new Date(Date.parse(`${date}T00:00:00+05:00`) + days * 86_400_000).toISOString();
}

/**
 * One page of the log, newest first, with the total for paging. Null when
 * the query fails. A start date after the end date is swapped round.
 */
export async function getActivityPage(supabase: SessionClient, filters: ActivityFilters) {
  let { from, to } = filters;
  if (from && to && from > to) [from, to] = [to, from];

  let query = supabase
    .from("activity_log")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .order("id", { ascending: false });
  if (filters.type) query = query.eq("entity_type", filters.type);
  if (filters.person === "system") query = query.is("actor_id", null);
  else if (filters.person) query = query.eq("actor_id", filters.person);
  const action = actionFilters.find((a) => a.value === filters.action);
  if (action) query = query.in("action", [...action.actions]);
  if (from) query = query.gte("created_at", pakistanMidnight(from));
  if (to) query = query.lt("created_at", pakistanMidnight(to, 1));

  const start = (filters.page - 1) * ACTIVITY_PAGE_SIZE;
  const { data, count, error } = await query.range(start, start + ACTIVITY_PAGE_SIZE - 1);
  // Asking for a page past the end is a 416 from PostgREST, not a failure.
  if (error && error.code !== "PGRST103") return null;
  return { entries: (data ?? []) as ActivityLogEntry[], total: count ?? 0 };
}

/** Which entries on this page still exist, so each line can link to its editor or say it was deleted. */
export async function existingEntries(supabase: SessionClient, entries: ActivityLogEntry[]) {
  const ids = (table: string) => [
    ...new Set(
      entries
        .filter((e) => e.entity_type === table && e.entity_id && isUuid(e.entity_id))
        .map((e) => e.entity_id!),
    ),
  ];
  const lookup = async (table: EntryTable) => {
    const wanted = ids(table);
    if (!wanted.length) return [];
    const { data, error } = await supabase.from(table).select("id").in("id", wanted);
    // If we can't tell, link anyway: the editor says if an entry is gone.
    if (error) return wanted;
    return data.map((r) => r.id);
  };
  const tables = Object.keys(entryTypes) as EntryTable[];
  return new Set((await Promise.all(tables.map(lookup))).flat());
}
