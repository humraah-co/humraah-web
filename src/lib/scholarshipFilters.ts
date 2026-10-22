import type { FieldSummary, ScholarshipCard } from "@/lib/data/public";
import type { ScholarshipKind, ScholarshipScope } from "@/lib/database.types";
import { daysUntil } from "@/lib/format";
import { many, one, type RawParams } from "@/lib/universityFilters";

/**
 * The Scholarships page keeps every filter in the URL, like Universities:
 * a filtered list can be shared and the back button works.
 */

export type ScholarshipSort = "deadline" | "az";

/**
 * "Type of support" options. Need-based government schemes count as
 * Government, as they do on the cards.
 */
export const supportTypes = [
  { value: "government", label: "Government", kinds: ["government", "need"] },
  { value: "university", label: "University aid", kinds: ["university"] },
  { value: "external", label: "External", kinds: ["external"] },
  { value: "merit", label: "Merit", kinds: ["merit"] },
] as const satisfies readonly { value: string; label: string; kinds: readonly ScholarshipKind[] }[];

export type SupportType = (typeof supportTypes)[number]["value"];

const isSupportType = (v: string): v is SupportType => supportTypes.some((t) => t.value === v);

export type ScholarshipFilters = {
  q: string;
  /** null shows both. */
  scope: ScholarshipScope | null;
  types: SupportType[];
  /** Field of study slug. */
  field: string | null;
  women: boolean;
  sort: ScholarshipSort;
};

export function parseScholarshipFilters(raw: RawParams): ScholarshipFilters {
  const scope = one(raw.scope);
  return {
    q: one(raw.q) ?? "",
    scope: scope === "pakistan" || scope === "international" ? scope : null,
    types: [...new Set(many(raw.type))].filter(isSupportType),
    field: one(raw.field) ?? null,
    women: one(raw.women) === "1",
    sort: one(raw.sort) === "az" ? "az" : "deadline",
  };
}

export function scholarshipsHref(filters: ScholarshipFilters, patch: Partial<ScholarshipFilters> = {}) {
  const next = { ...filters, ...patch };
  const params = new URLSearchParams();
  if (next.q) params.set("q", next.q);
  if (next.scope) params.set("scope", next.scope);
  for (const type of next.types) params.append("type", type);
  if (next.field) params.set("field", next.field);
  if (next.women) params.set("women", "1");
  if (next.sort !== "deadline") params.set("sort", next.sort);
  const query = params.toString();
  return query ? `/scholarships?${query}` : "/scholarships";
}

/** How many filters are on (the search words and Pakistan/International don't count). */
export function activeScholarshipFilterCount(f: ScholarshipFilters) {
  return f.types.length + (f.field ? 1 : 0) + Number(f.women);
}

/** Women-only scholarships and those with places reserved for women. */
export function isForWomen(s: Pick<ScholarshipCard, "women_only" | "audience_note">) {
  return s.women_only || /\bwomen\b|\bfemale\b|\bgirls\b/i.test(s.audience_note ?? "");
}

/** Open ones by closing date, then ones with no date yet, then closed ones. */
function deadlineRank(s: ScholarshipCard) {
  if (!s.deadline) return { group: 1, days: 0 };
  const days = daysUntil(s.deadline);
  return days < 0 ? { group: 2, days: -days } : { group: 0, days };
}

export function applyScholarshipFilters(
  cards: ScholarshipCard[],
  f: ScholarshipFilters,
  fields: FieldSummary[],
) {
  const field = f.field ? fields.find((x) => x.slug === f.field) : undefined;
  const kinds = new Set<ScholarshipKind>(
    supportTypes.filter((t) => f.types.includes(t.value)).flatMap((t) => t.kinds),
  );
  const words = f.q.toLowerCase().split(/\s+/).filter(Boolean);

  const result = cards.filter((s) => {
    if (f.scope && s.scope !== f.scope) return false;
    if (kinds.size > 0 && !kinds.has(s.kind)) return false;
    if (f.women && !isForWomen(s)) return false;
    // A scholarship with no fields listed is open to any field. An unknown
    // field slug in the URL matches nothing rather than everything.
    if (f.field && (!field || (s.fieldIds.length > 0 && !s.fieldIds.includes(field.id)))) return false;
    if (words.length > 0) {
      const haystack = [s.name, s.provider, s.summary, s.audience_note, ...s.covers, ...s.eligible_areas]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      if (!words.every((w) => haystack.includes(w))) return false;
    }
    return true;
  });

  const byName = (a: ScholarshipCard, b: ScholarshipCard) => a.name.localeCompare(b.name, "en");
  if (f.sort === "az") return result.sort(byName);
  return result.sort((a, b) => {
    const ra = deadlineRank(a);
    const rb = deadlineRank(b);
    return ra.group - rb.group || ra.days - rb.days || byName(a, b);
  });
}
