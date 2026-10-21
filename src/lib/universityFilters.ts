import type { FieldSummary, UniversityCard } from "@/lib/data/public";

/**
 * The Universities page keeps every filter in the URL, so a filtered list can
 * be shared and the back button works. These helpers read the query string,
 * build the link for any change to it, and apply it to the published list.
 */

export const PAGE_SIZE = 12;

export type SortOrder = "az" | "za";
export type UniversityType = "public" | "private";

export type UniversityFilters = {
  q: string;
  cities: string[];
  types: UniversityType[];
  /** Field of study slug. */
  field: string | null;
  women: boolean;
  hostel: boolean;
  aid: boolean;
  sort: SortOrder;
  limit: number;
};

type RawParams = Record<string, string | string[] | undefined>;

const many = (value: string | string[] | undefined) =>
  value === undefined ? [] : (Array.isArray(value) ? value : [value]).map((v) => v.trim()).filter(Boolean);
const one = (value: string | string[] | undefined) => many(value)[0];

export function parseFilters(raw: RawParams): UniversityFilters {
  const limit = Number.parseInt(one(raw.limit) ?? "", 10);
  return {
    q: one(raw.q) ?? "",
    cities: [...new Set(many(raw.city))],
    types: [...new Set(many(raw.type))].filter((t): t is UniversityType => t === "public" || t === "private"),
    field: one(raw.field) ?? null,
    women: one(raw.women) === "1",
    hostel: one(raw.hostel) === "1",
    aid: one(raw.aid) === "1",
    sort: one(raw.sort) === "za" ? "za" : "az",
    limit: Number.isFinite(limit) ? Math.min(Math.max(limit, PAGE_SIZE), 500) : PAGE_SIZE,
  };
}

/** The link for the current filters with `patch` applied. The page size resets unless the patch sets it. */
export function hrefWith(filters: UniversityFilters, patch: Partial<UniversityFilters> = {}) {
  const next = { ...filters, limit: PAGE_SIZE, ...patch };
  const params = new URLSearchParams();
  if (next.q) params.set("q", next.q);
  for (const city of next.cities) params.append("city", city);
  for (const type of next.types) params.append("type", type);
  if (next.field) params.set("field", next.field);
  if (next.women) params.set("women", "1");
  if (next.hostel) params.set("hostel", "1");
  if (next.aid) params.set("aid", "1");
  if (next.sort !== "az") params.set("sort", next.sort);
  if (next.limit > PAGE_SIZE) params.set("limit", String(next.limit));
  const query = params.toString();
  return query ? `/universities?${query}` : "/universities";
}

export function toggled<T>(list: T[], value: T) {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
}

/** How many filters are on (the search words don't count). */
export function activeFilterCount(f: UniversityFilters) {
  return (
    f.cities.length + f.types.length + (f.field ? 1 : 0) + Number(f.women) + Number(f.hostel) + Number(f.aid)
  );
}

export function applyFilters(cards: UniversityCard[], f: UniversityFilters, fields: FieldSummary[]) {
  const field = f.field ? fields.find((x) => x.slug === f.field) : undefined;
  const fieldNames = new Map(fields.map((x) => [x.id, x.name]));
  const cities = f.cities.map((c) => c.toLowerCase());
  const words = f.q.toLowerCase().split(/\s+/).filter(Boolean);

  const result = cards.filter((u) => {
    if (cities.length > 0 && !cities.includes(u.city.toLowerCase())) return false;
    if (f.types.length > 0 && (!u.type || !f.types.includes(u.type))) return false;
    // An unknown field slug in the URL matches nothing rather than everything.
    if (f.field && (!field || !u.fieldIds.includes(field.id))) return false;
    if (f.women && !u.women_only) return false;
    if (f.hostel && !u.has_hostel) return false;
    if (f.aid && !u.need_based_aid) return false;
    if (words.length > 0) {
      const haystack = [
        u.name,
        u.short_name,
        u.city,
        u.campuses_note,
        u.province,
        ...u.programmes.map((p) => p.name),
        ...u.fieldIds.map((id) => fieldNames.get(id)),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      if (!words.every((w) => haystack.includes(w))) return false;
    }
    return true;
  });

  result.sort((a, b) => a.name.localeCompare(b.name, "en"));
  return f.sort === "za" ? result.reverse() : result;
}

/** Cities with published universities, most universities first, for the City filter. */
export function cityOptions(cards: UniversityCard[]) {
  const counts = new Map<string, number>();
  for (const u of cards) counts.set(u.city, (counts.get(u.city) ?? 0) + 1);
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "en"))
    .map(([city]) => city);
}
