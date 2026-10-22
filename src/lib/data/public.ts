import "server-only";
import { unstable_cache } from "next/cache";
import { createPublicClient } from "@/lib/supabase/public";
import type { Field, Scholarship, University } from "@/lib/database.types";

/**
 * Public data access. Every query goes through the anon client, so row-level
 * security limits results to published rows. Each function returns `null`
 * when Supabase isn't configured, and throws on a real database error.
 *
 * Results are cached for five minutes, so a change published in the admin
 * portal shows on the site within five minutes.
 */
const REVALIDATE = 300;

function fail(what: string, message: string): never {
  throw new Error(`Could not load ${what}: ${message}`);
}

// ---------------------------------------------------------------------------
// Counts
// ---------------------------------------------------------------------------

export async function getPublishedCounts() {
  const supabase = createPublicClient();
  if (!supabase) return null;

  const count = async (table: "fields" | "universities" | "scholarships" | "resources") => {
    const { count, error } = await supabase.from(table).select("*", { count: "exact", head: true });
    if (error) fail(table, error.message);
    return count ?? 0;
  };

  const [fields, universities, scholarships, resources] = await Promise.all([
    count("fields"),
    count("universities"),
    count("scholarships"),
    count("resources"),
  ]);
  return { fields, universities, scholarships, resources };
}

// ---------------------------------------------------------------------------
// Fields of study
// ---------------------------------------------------------------------------

export type FieldSummary = Pick<
  Field,
  | "id"
  | "slug"
  | "name"
  | "summary"
  | "you_might_enjoy"
  | "interests"
  | "example_programmes"
  | "last_verified_at"
>;

const FIELD_COLUMNS =
  "id, slug, name, summary, you_might_enjoy, interests, example_programmes, last_verified_at";

export const listFields = unstable_cache(
  async (): Promise<FieldSummary[] | null> => {
    const supabase = createPublicClient();
    if (!supabase) return null;
    const { data, error } = await supabase.from("fields").select(FIELD_COLUMNS).order("sort_order");
    if (error) fail("fields", error.message);
    return data;
  },
  ["fields"],
  { revalidate: REVALIDATE, tags: ["fields"] },
);

export async function getField(slug: string) {
  const fields = await listFields();
  if (!fields) return null;
  return fields.find((f) => f.slug === slug) ?? undefined;
}

// ---------------------------------------------------------------------------
// Universities
// ---------------------------------------------------------------------------

export type ProgrammeSummary = {
  name: string;
  fieldId: string | null;
  level: string;
  entryRequirements: string | null;
  entryTest: string | null;
};

export type UniversityCard = Pick<
  University,
  | "id"
  | "slug"
  | "name"
  | "short_name"
  | "city"
  | "campuses_note"
  | "province"
  | "type"
  | "women_only"
  | "has_hostel"
  | "need_based_aid"
  | "admissions_window"
  | "last_verified_at"
> & {
  programmes: ProgrammeSummary[];
  fieldIds: string[];
};

const UNIVERSITY_CARD_COLUMNS =
  "id, slug, name, short_name, city, campuses_note, province, type, women_only, has_hostel, need_based_aid, admissions_window, last_verified_at";

/**
 * Every published university with its programmes. The whole list is small
 * (a few hundred rows at most), so filtering happens in the page rather than
 * in one query per filter combination.
 */
export const listUniversityCards = unstable_cache(
  async (): Promise<UniversityCard[] | null> => {
    const supabase = createPublicClient();
    if (!supabase) return null;
    const [unis, progs] = await Promise.all([
      supabase.from("universities").select(UNIVERSITY_CARD_COLUMNS).order("name"),
      supabase
        .from("programmes")
        .select("university_id, field_id, name, level, entry_requirements, entry_test, sort_order")
        .order("sort_order"),
    ]);
    if (unis.error) fail("universities", unis.error.message);
    if (progs.error) fail("programmes", progs.error.message);

    const byUniversity = new Map<string, ProgrammeSummary[]>();
    for (const p of progs.data) {
      const list = byUniversity.get(p.university_id) ?? [];
      list.push({
        name: p.name,
        fieldId: p.field_id,
        level: p.level,
        entryRequirements: p.entry_requirements,
        entryTest: p.entry_test,
      });
      byUniversity.set(p.university_id, list);
    }
    return unis.data.map((u) => {
      const programmes = byUniversity.get(u.id) ?? [];
      const fieldIds = [...new Set(programmes.map((p) => p.fieldId).filter((id): id is string => !!id))];
      return { ...u, programmes, fieldIds };
    });
  },
  ["university-cards"],
  { revalidate: REVALIDATE, tags: ["universities"] },
);

export type UniversityProfile = University & { programmes: ProgrammeSummary[] };

export const getUniversity = unstable_cache(
  async (slug: string): Promise<UniversityProfile | null | undefined> => {
    const supabase = createPublicClient();
    if (!supabase) return null;
    const { data: uni, error } = await supabase
      .from("universities")
      .select("*")
      .eq("slug", slug)
      .maybeSingle();
    if (error) fail("university", error.message);
    if (!uni) return undefined;
    const { data: progs, error: pErr } = await supabase
      .from("programmes")
      .select("field_id, name, level, entry_requirements, entry_test")
      .eq("university_id", uni.id)
      .order("sort_order");
    if (pErr) fail("programmes", pErr.message);
    return {
      ...uni,
      programmes: progs.map((p) => ({
        name: p.name,
        fieldId: p.field_id,
        level: p.level,
        entryRequirements: p.entry_requirements,
        entryTest: p.entry_test,
      })),
    };
  },
  ["university"],
  { revalidate: REVALIDATE, tags: ["universities"] },
);

export async function listUniversitySlugs() {
  const cards = await listUniversityCards();
  return cards?.map((u) => u.slug) ?? [];
}

// ---------------------------------------------------------------------------
// Scholarships
// ---------------------------------------------------------------------------

export type ScholarshipCard = Pick<
  Scholarship,
  | "id"
  | "slug"
  | "name"
  | "provider"
  | "kind"
  | "scope"
  | "summary"
  | "women_only"
  | "covers"
  | "audience_note"
  | "deadline"
  | "deadline_note"
  | "eligible_areas"
  | "last_verified_at"
> & { fieldIds: string[] };

const SCHOLARSHIP_CARD_COLUMNS =
  "id, slug, name, provider, kind, scope, summary, women_only, covers, audience_note, deadline, deadline_note, eligible_areas, last_verified_at";

export const listScholarshipCards = unstable_cache(
  async (): Promise<ScholarshipCard[] | null> => {
    const supabase = createPublicClient();
    if (!supabase) return null;
    const [schols, links] = await Promise.all([
      supabase
        .from("scholarships")
        .select(SCHOLARSHIP_CARD_COLUMNS)
        .order("deadline", { ascending: true, nullsFirst: false })
        .order("name"),
      supabase.from("scholarship_fields").select("scholarship_id, field_id"),
    ]);
    if (schols.error) fail("scholarships", schols.error.message);
    if (links.error) fail("scholarship fields", links.error.message);
    return schols.data.map((s) => ({
      ...s,
      fieldIds: links.data.filter((l) => l.scholarship_id === s.id).map((l) => l.field_id),
    }));
  },
  ["scholarship-cards"],
  { revalidate: REVALIDATE, tags: ["scholarships"] },
);

export type ScholarshipDetail = Scholarship & { fieldIds: string[] };

export const getScholarship = unstable_cache(
  async (slug: string): Promise<ScholarshipDetail | null | undefined> => {
    const supabase = createPublicClient();
    if (!supabase) return null;
    const { data, error } = await supabase.from("scholarships").select("*").eq("slug", slug).maybeSingle();
    if (error) fail("scholarship", error.message);
    if (!data) return undefined;
    const { data: links, error: lErr } = await supabase
      .from("scholarship_fields")
      .select("field_id")
      .eq("scholarship_id", data.id);
    if (lErr) fail("scholarship fields", lErr.message);
    return { ...data, fieldIds: links.map((l) => l.field_id) };
  },
  ["scholarship"],
  { revalidate: REVALIDATE, tags: ["scholarships"] },
);
