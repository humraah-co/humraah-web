import "server-only";
import { unstable_cache } from "next/cache";
import { createPublicClient } from "@/lib/supabase/public";
import type { Field, GuidanceArticle, Resource, Scholarship, University } from "@/lib/database.types";
import type { Locale } from "@/i18n/config";
import { asEnglish, localize, type WithEnglish } from "@/i18n/localize";

/**
 * Public data access. Every query goes through the anon client, so row-level
 * security limits results to published rows. Each function returns `null`
 * when Supabase isn't configured, and throws on a real database error.
 *
 * Every query here is cached (unstable_cache) and tagged by table, so the
 * public pages don't touch the database on each visit. Saving, archiving
 * or deleting an entry in the admin portal clears its table's tag
 * (revalidateEntries), so changes show straight away; otherwise the cache
 * refreshes every five minutes. New public queries should be cached the
 * same way.
 *
 * Each loader takes the page's language. English selects only the English
 * columns, exactly as before Urdu existed; Urdu also selects the "_ur"
 * columns and swaps them in with localize(), which lists the fields that
 * fell back to English in `english`. The language is part of the cache
 * key (it's an argument), and the tags stay per table, so an edit clears
 * both languages.
 */
const REVALIDATE = 300;

/** ", a_ur, b_ur" for an Urdu select; "" for English. */
const urduColumns = (locale: Locale, fields: readonly string[]) =>
  locale === "ur" ? fields.map((f) => `, ${f}_ur`).join("") : "";

function fail(what: string, message: string): never {
  throw new Error(`Could not load ${what}: ${message}`);
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
> &
  WithEnglish;

const FIELD_COLUMNS =
  "id, slug, name, summary, you_might_enjoy, interests, example_programmes, last_verified_at";
const FIELD_URDU = ["name", "summary", "you_might_enjoy", "interests", "example_programmes"] as const;

export const listFields = unstable_cache(
  async (locale: Locale = "en"): Promise<FieldSummary[] | null> => {
    const supabase = createPublicClient();
    if (!supabase) return null;
    const { data, error } = await supabase
      .from("fields")
      .select(FIELD_COLUMNS + urduColumns(locale, FIELD_URDU))
      .order("sort_order")
      .returns<Field[]>();
    if (error) fail("fields", error.message);
    return data.map((f) => (locale === "ur" ? localize(f, FIELD_URDU) : asEnglish(f)));
  },
  ["fields"],
  { revalidate: REVALIDATE, tags: ["fields"] },
);

export async function getField(slug: string, locale: Locale = "en") {
  const fields = await listFields(locale);
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
  /** Of entryRequirements and entryTest, those shown in English on an Urdu page. */
  english: ("entryRequirements" | "entryTest")[];
};

type ProgrammeRow = {
  university_id?: string;
  field_id: string | null;
  name: string;
  level: string;
  entry_requirements: string | null;
  entry_test: string | null;
  entry_requirements_ur?: string | null;
  entry_test_ur?: string | null;
};

const PROGRAMME_URDU = ["entry_requirements", "entry_test"] as const;

function programmeSummary(p: ProgrammeRow, locale: Locale): ProgrammeSummary {
  const row = locale === "ur" ? localize(p, PROGRAMME_URDU) : asEnglish(p);
  return {
    name: row.name,
    fieldId: row.field_id,
    level: row.level,
    entryRequirements: row.entry_requirements,
    entryTest: row.entry_test,
    english: row.english.map((f) => (f === "entry_test" ? "entryTest" : "entryRequirements")),
  };
}

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
> &
  WithEnglish & {
    programmes: ProgrammeSummary[];
    fieldIds: string[];
  };

const UNIVERSITY_CARD_COLUMNS =
  "id, slug, name, short_name, city, campuses_note, province, type, women_only, has_hostel, need_based_aid, admissions_window, last_verified_at";
const UNIVERSITY_CARD_URDU = ["campuses_note", "admissions_window"] as const;
const UNIVERSITY_URDU = [
  "campuses_note",
  "overview",
  "how_to_apply",
  "required_documents",
  "fee_note",
  "admissions_window",
  "admission_test",
] as const;
/** A university keeps its English name unless it has a well-known Urdu one. */
const UNIVERSITY_NAMES = ["name"] as const;

/**
 * Every published university with its programmes. The whole list is small
 * (a few hundred rows at most), so filtering happens in the page rather than
 * in one query per filter combination.
 */
export const listUniversityCards = unstable_cache(
  async (locale: Locale = "en"): Promise<UniversityCard[] | null> => {
    const supabase = createPublicClient();
    if (!supabase) return null;
    const [unis, progs] = await Promise.all([
      supabase
        .from("universities")
        .select(UNIVERSITY_CARD_COLUMNS + urduColumns(locale, [...UNIVERSITY_CARD_URDU, ...UNIVERSITY_NAMES]))
        .order("name")
        .returns<University[]>(),
      supabase
        .from("programmes")
        .select(
          "university_id, field_id, name, level, entry_requirements, entry_test, sort_order" +
            urduColumns(locale, PROGRAMME_URDU),
        )
        .order("sort_order")
        .returns<(ProgrammeRow & { university_id: string })[]>(),
    ]);
    if (unis.error) fail("universities", unis.error.message);
    if (progs.error) fail("programmes", progs.error.message);

    const byUniversity = new Map<string, ProgrammeSummary[]>();
    for (const p of progs.data) {
      const list = byUniversity.get(p.university_id) ?? [];
      list.push(programmeSummary(p, locale));
      byUniversity.set(p.university_id, list);
    }
    return unis.data.map((u) => {
      const programmes = byUniversity.get(u.id) ?? [];
      const fieldIds = [...new Set(programmes.map((p) => p.fieldId).filter((id): id is string => !!id))];
      const row = locale === "ur" ? localize(u, UNIVERSITY_CARD_URDU, UNIVERSITY_NAMES) : asEnglish(u);
      return { ...row, programmes, fieldIds };
    });
  },
  ["university-cards"],
  { revalidate: REVALIDATE, tags: ["universities"] },
);

export type UniversityProfile = University & WithEnglish & { programmes: ProgrammeSummary[] };

export const getUniversity = unstable_cache(
  async (slug: string, locale: Locale = "en"): Promise<UniversityProfile | null | undefined> => {
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
      .select("field_id, name, level, entry_requirements, entry_test" + urduColumns(locale, PROGRAMME_URDU))
      .eq("university_id", uni.id)
      .order("sort_order")
      .returns<ProgrammeRow[]>();
    if (pErr) fail("programmes", pErr.message);
    const row = locale === "ur" ? localize(uni, UNIVERSITY_URDU, UNIVERSITY_NAMES) : asEnglish(uni);
    return {
      ...(row as University & WithEnglish),
      programmes: progs.map((p) => programmeSummary(p, locale)),
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
> &
  WithEnglish & { fieldIds: string[] };

const SCHOLARSHIP_CARD_COLUMNS =
  "id, slug, name, provider, kind, scope, summary, women_only, covers, audience_note, deadline, deadline_note, eligible_areas, last_verified_at";
const SCHOLARSHIP_CARD_URDU = [
  "summary",
  "covers",
  "audience_note",
  "deadline_note",
  "eligible_areas",
] as const;
const SCHOLARSHIP_URDU = [...SCHOLARSHIP_CARD_URDU, "who_its_for", "what_it_covers", "how_to_apply"] as const;

export const listScholarshipCards = unstable_cache(
  async (locale: Locale = "en"): Promise<ScholarshipCard[] | null> => {
    const supabase = createPublicClient();
    if (!supabase) return null;
    const [schols, links] = await Promise.all([
      supabase
        .from("scholarships")
        .select(SCHOLARSHIP_CARD_COLUMNS + urduColumns(locale, SCHOLARSHIP_CARD_URDU))
        .order("deadline", { ascending: true, nullsFirst: false })
        .order("name")
        .returns<Scholarship[]>(),
      supabase.from("scholarship_fields").select("scholarship_id, field_id"),
    ]);
    if (schols.error) fail("scholarships", schols.error.message);
    if (links.error) fail("scholarship fields", links.error.message);
    return schols.data.map((s) => ({
      ...(locale === "ur" ? localize(s, SCHOLARSHIP_CARD_URDU) : asEnglish(s)),
      fieldIds: links.data.filter((l) => l.scholarship_id === s.id).map((l) => l.field_id),
    }));
  },
  ["scholarship-cards"],
  { revalidate: REVALIDATE, tags: ["scholarships"] },
);

export type ScholarshipDetail = Scholarship & WithEnglish & { fieldIds: string[] };

export const getScholarship = unstable_cache(
  async (slug: string, locale: Locale = "en"): Promise<ScholarshipDetail | null | undefined> => {
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
    const row = locale === "ur" ? localize(data, SCHOLARSHIP_URDU) : asEnglish(data);
    return { ...(row as Scholarship & WithEnglish), fieldIds: links.map((l) => l.field_id) };
  },
  ["scholarship"],
  { revalidate: REVALIDATE, tags: ["scholarships"] },
);

// ---------------------------------------------------------------------------
// Guidance articles
// ---------------------------------------------------------------------------

export type GuidanceSummary = Pick<
  GuidanceArticle,
  "id" | "slug" | "title" | "summary" | "body_markdown" | "last_verified_at"
> &
  WithEnglish;

const GUIDANCE_URDU = ["title", "summary", "body_markdown"] as const;

/** Every published article in reading order. The body comes too, for the read time. */
export const listGuidanceArticles = unstable_cache(
  async (locale: Locale = "en"): Promise<GuidanceSummary[] | null> => {
    const supabase = createPublicClient();
    if (!supabase) return null;
    const { data, error } = await supabase
      .from("guidance_articles")
      .select(
        "id, slug, title, summary, body_markdown, last_verified_at" + urduColumns(locale, GUIDANCE_URDU),
      )
      .order("sort_order")
      .order("title")
      .returns<GuidanceArticle[]>();
    if (error) fail("guidance articles", error.message);
    return data.map((a) => (locale === "ur" ? localize(a, GUIDANCE_URDU) : asEnglish(a)));
  },
  ["guidance-articles"],
  { revalidate: REVALIDATE, tags: ["guidance"] },
);

export const getGuidanceArticle = unstable_cache(
  async (
    slug: string,
    locale: Locale = "en",
  ): Promise<(GuidanceArticle & WithEnglish) | null | undefined> => {
    const supabase = createPublicClient();
    if (!supabase) return null;
    const { data, error } = await supabase
      .from("guidance_articles")
      .select("*")
      .eq("slug", slug)
      .maybeSingle();
    if (error) fail("guidance article", error.message);
    if (!data) return undefined;
    return (locale === "ur" ? localize(data, GUIDANCE_URDU) : asEnglish(data)) as GuidanceArticle &
      WithEnglish;
  },
  ["guidance-article"],
  { revalidate: REVALIDATE, tags: ["guidance"] },
);

// ---------------------------------------------------------------------------
// Resources
// ---------------------------------------------------------------------------

export type ResourceLink = Pick<Resource, "id" | "title" | "description" | "url" | "category"> & WithEnglish;

const RESOURCE_URDU = ["title", "description"] as const;

export const listResources = unstable_cache(
  async (locale: Locale = "en"): Promise<ResourceLink[] | null> => {
    const supabase = createPublicClient();
    if (!supabase) return null;
    const { data, error } = await supabase
      .from("resources")
      .select("id, title, description, url, category" + urduColumns(locale, RESOURCE_URDU))
      .order("sort_order")
      .order("title")
      .returns<Resource[]>();
    if (error) fail("resources", error.message);
    return data.map((r) => (locale === "ur" ? localize(r, RESOURCE_URDU) : asEnglish(r)));
  },
  ["resources"],
  { revalidate: REVALIDATE, tags: ["resources"] },
);
