/**
 * Site search: cleaning the query, matching it against the published content
 * the cached loaders return, and grouping the matches by type. No framework
 * or database code here, so the tests can load this file directly.
 */

import type {
  FieldSummary,
  GuidanceSummary,
  ResourceLink,
  ScholarshipCard,
  UniversityCard,
} from "./data/public.ts";

export const MAX_QUERY_LENGTH = 80;
/** Most results shown for each type. */
export const PER_TYPE_LIMIT = 10;

export type SearchKind = "universities" | "scholarships" | "fields" | "guidance" | "resources";

/** Order of the groups on the results page. */
export const searchKinds: SearchKind[] = ["universities", "scholarships", "fields", "guidance", "resources"];

/**
 * The query as it will be searched for: the first value if the address had
 * several, control characters and runs of spaces collapsed to one space,
 * trimmed, and cut to 80 characters (never in the middle of a character).
 */
export function cleanQuery(raw: unknown): string {
  const value = Array.isArray(raw) ? raw[0] : raw;
  if (typeof value !== "string") return "";
  const spaced = value
    // eslint-disable-next-line no-control-regex -- control characters are exactly what is removed
    .replace(/[\u0000-\u001f\u007f-\u009f]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return [...spaced].slice(0, MAX_QUERY_LENGTH).join("").trim();
}

const fold = (text: string) => text.normalize("NFKC").toLocaleLowerCase();

/** The words of a cleaned query, lower-cased. */
export const queryWords = (query: string) => fold(query).split(" ").filter(Boolean);

/** True when every word of the query appears, in any case, somewhere in the given texts. */
export function matchesText(words: string[], texts: (string | null | undefined)[]): boolean {
  if (words.length === 0) return false;
  const haystack = fold(texts.filter(Boolean).join(" "));
  return words.every((w) => haystack.includes(w));
}

export type SearchResult = {
  id: string;
  title: string;
  /** A short line under the title: city, provider, summary. */
  detail: string | null;
  /** Site path (no language prefix) or, for a resource, the external address. */
  href: string;
  external: boolean;
  /** True when the title itself holds the query, so these results list first. */
  titleMatch: boolean;
  /** The title, or the detail line, is shown in English on an Urdu page (no Urdu yet). */
  titleEnglish: boolean;
  detailEnglish: boolean;
};

export type SearchGroup = { kind: SearchKind; total: number; results: SearchResult[] };

export type SearchData = {
  universities: UniversityCard[] | null;
  scholarships: ScholarshipCard[] | null;
  fields: FieldSummary[] | null;
  guidance: GuidanceSummary[] | null;
  resources: ResourceLink[] | null;
};

/** The items whose `texts` hold the query, title matches first; each half keeps the loader's order. */
function collect<T>(
  items: T[] | null,
  words: string[],
  describe: (item: T) => { title: string; texts: (string | null | undefined)[] },
  toResult: (item: T, titleMatch: boolean) => SearchResult,
): SearchResult[] {
  const hits: SearchResult[] = [];
  for (const item of items ?? []) {
    const { title, texts } = describe(item);
    if (!matchesText(words, texts)) continue;
    hits.push(toResult(item, matchesText(words, [title])));
  }
  return [...hits.filter((h) => h.titleMatch), ...hits.filter((h) => !h.titleMatch)];
}

/**
 * The matches for `query` in each type that has any, with at most `limit`
 * of each (`total` is the full count). An empty query matches nothing.
 */
export function searchContent(query: string, data: SearchData, limit = PER_TYPE_LIMIT): SearchGroup[] {
  const words = queryWords(cleanQuery(query));
  if (words.length === 0) return [];

  const lists: Record<SearchKind, SearchResult[]> = {
    universities: collect(
      data.universities,
      words,
      (u) => ({
        title: [u.name, u.short_name].filter(Boolean).join(" "),
        texts: [
          u.name,
          u.short_name,
          u.city,
          u.campuses_note,
          u.province,
          ...u.programmes.map((p) => p.name),
        ],
      }),
      (u, titleMatch) => ({
        id: u.id,
        title: u.name,
        detail: u.city,
        href: `/universities/${u.slug}`,
        external: false,
        titleMatch,
        titleEnglish: false,
        detailEnglish: false,
      }),
    ),
    scholarships: collect(
      data.scholarships,
      words,
      (s) => ({
        title: s.name,
        texts: [s.name, s.provider, s.summary, s.audience_note, ...s.covers, ...s.eligible_areas],
      }),
      (s, titleMatch) => ({
        id: s.id,
        title: s.name,
        detail: s.provider,
        href: `/scholarships/${s.slug}`,
        external: false,
        titleMatch,
        titleEnglish: false,
        detailEnglish: false,
      }),
    ),
    fields: collect(
      data.fields,
      words,
      (f) => ({
        title: f.name,
        texts: [f.name, f.summary, f.you_might_enjoy, ...f.interests, ...f.example_programmes],
      }),
      (f, titleMatch) => ({
        id: f.id,
        title: f.name,
        detail: f.summary,
        href: `/explore/${f.slug}`,
        external: false,
        titleMatch,
        titleEnglish: false,
        detailEnglish: f.english.includes("summary"),
      }),
    ),
    guidance: collect(
      data.guidance,
      words,
      (a) => ({ title: a.title, texts: [a.title, a.summary] }),
      (a, titleMatch) => ({
        id: a.id,
        title: a.title,
        detail: a.summary,
        href: `/guidance/${a.slug}`,
        external: false,
        titleMatch,
        titleEnglish: a.english.includes("title"),
        detailEnglish: a.english.includes("summary"),
      }),
    ),
    resources: collect(
      data.resources,
      words,
      (r) => ({ title: r.title, texts: [r.title, r.description, r.category] }),
      (r, titleMatch) => ({
        id: r.id,
        title: r.title,
        detail: r.description,
        href: r.url,
        external: true,
        titleMatch,
        titleEnglish: r.english.includes("title"),
        detailEnglish: r.english.includes("description"),
      }),
    ),
  };

  return searchKinds
    .filter((kind) => lists[kind].length > 0)
    .map((kind) => ({ kind, total: lists[kind].length, results: lists[kind].slice(0, limit) }));
}

/** How many results in all, for the count announced to screen readers. */
export const totalResults = (groups: SearchGroup[]) => groups.reduce((n, g) => n + g.total, 0);

/** The results page address for a query, without a language prefix; null for an empty query. */
export function searchPath(query: string): string | null {
  const q = cleanQuery(query);
  return q ? `/search?q=${encodeURIComponent(q)}` : null;
}
