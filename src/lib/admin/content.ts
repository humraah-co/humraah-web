/**
 * Universities and scholarships in the admin portal: what the editors hold,
 * how they're checked, and how a form becomes a database row. Shared by the
 * editors (in the browser) and their server actions, which check again.
 */

import type {
  ContentStatus,
  Programme,
  Scholarship,
  ScholarshipKind,
  ScholarshipScope,
  University,
  UniversityType,
} from "@/lib/database.types";

export type EntryTable = "universities" | "scholarships";

export const entryTypes = {
  universities: {
    label: "Universities",
    one: "university",
    adminPath: "/admin/universities",
    publicPath: "/universities",
  },
  scholarships: {
    label: "Scholarships",
    one: "scholarship",
    adminPath: "/admin/scholarships",
    publicPath: "/scholarships",
  },
} as const satisfies Record<EntryTable, unknown>;

export const isEntryTable = (value: unknown): value is EntryTable =>
  value === "universities" || value === "scholarships";

export const contentStatusLabels: Record<ContentStatus, string> = {
  draft: "Draft",
  published: "Published",
  archived: "Archived",
};

/** The team's names for the kinds of support (the public site groups some of them). */
export const scholarshipKindLabels: Record<ScholarshipKind, string> = {
  government: "Government",
  need: "Need-based",
  merit: "Merit",
  university: "University aid",
  external: "External",
};

export const scholarshipScopeLabels: Record<ScholarshipScope, string> = {
  pakistan: "In Pakistan",
  international: "International",
};

export const provinces = [
  "Islamabad Capital Territory",
  "Punjab",
  "Sindh",
  "Khyber Pakhtunkhwa",
  "Balochistan",
  "Gilgit-Baltistan",
  "Azad Jammu and Kashmir",
];

// ---------------------------------------------------------------------------
// Web addresses (slugs)
// ---------------------------------------------------------------------------

export const SLUG_MAX = 80;
const slugPattern = /^[a-z0-9]+(-[a-z0-9]+)*$/;

/** Lower case without accents, so "quaid" finds "Quaid-i-Azam" and "Lahore" finds "LAHORE". */
export const fold = (text: string) => text.normalize("NFKD").replace(/\p{M}/gu, "").toLowerCase();

/** "Quaid-i-Azam University" → "quaid-i-azam-university". */
export function slugify(text: string) {
  return fold(text)
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, SLUG_MAX)
    .replace(/-+$/, "");
}

// ---------------------------------------------------------------------------
// Form values: what the editors hold, as text the inputs can show
// ---------------------------------------------------------------------------

export type YesNo = "" | "yes" | "no";

export type ProgrammeValues = {
  /** Only for React lists; never saved. */
  key: string;
  field_id: string;
  name: string;
  level: string;
  entry_requirements: string;
  entry_test: string;
};

export type UniversityValues = {
  name: string;
  short_name: string;
  slug: string;
  city: string;
  campuses_note: string;
  province: string;
  type: "" | UniversityType;
  hec_recognised: boolean;
  women_only: boolean;
  has_hostel: YesNo;
  need_based_aid: YesNo;
  overview: string;
  website_url: string;
  admissions_url: string;
  admission_test: string;
  admissions_window: string;
  fee_min_pkr: string;
  fee_max_pkr: string;
  fee_note: string;
  how_to_apply: string;
  required_documents: string;
  source_url: string;
  programmes: ProgrammeValues[];
};

export type ScholarshipValues = {
  name: string;
  slug: string;
  provider: string;
  scope: ScholarshipScope;
  kind: "" | ScholarshipKind;
  women_only: boolean;
  audience_note: string;
  summary: string;
  who_its_for: string;
  what_it_covers: string;
  covers: string;
  eligible_areas: string;
  field_ids: string[];
  deadline: string;
  deadline_note: string;
  how_to_apply: string;
  official_url: string;
  source_url: string;
};

/**
 * Blank forms. Every yes/no shown on the public site starts as "no" or
 * "not sure yet", never as a claim nobody has checked.
 */
export const emptyUniversity: UniversityValues = {
  name: "",
  short_name: "",
  slug: "",
  city: "",
  campuses_note: "",
  province: "",
  type: "",
  hec_recognised: false,
  women_only: false,
  has_hostel: "",
  need_based_aid: "",
  overview: "",
  website_url: "",
  admissions_url: "",
  admission_test: "",
  admissions_window: "",
  fee_min_pkr: "",
  fee_max_pkr: "",
  fee_note: "",
  how_to_apply: "",
  required_documents: "",
  source_url: "",
  programmes: [],
};

export const emptyScholarship: ScholarshipValues = {
  name: "",
  slug: "",
  provider: "",
  scope: "pakistan",
  kind: "",
  women_only: false,
  audience_note: "",
  summary: "",
  who_its_for: "",
  what_it_covers: "",
  covers: "",
  eligible_areas: "",
  field_ids: [],
  deadline: "",
  deadline_note: "",
  how_to_apply: "",
  official_url: "",
  source_url: "",
};

const yesNo = (value: boolean | null): YesNo => (value == null ? "" : value ? "yes" : "no");
const lines = (items: string[]) => items.join("\n");

export function universityToValues(
  u: University,
  programmes: Pick<Programme, "id" | "field_id" | "name" | "level" | "entry_requirements" | "entry_test">[],
): UniversityValues {
  return {
    name: u.name,
    short_name: u.short_name ?? "",
    slug: u.slug,
    city: u.city,
    campuses_note: u.campuses_note ?? "",
    province: u.province ?? "",
    type: u.type ?? "",
    hec_recognised: u.hec_recognised,
    women_only: u.women_only,
    has_hostel: yesNo(u.has_hostel),
    need_based_aid: yesNo(u.need_based_aid),
    overview: u.overview ?? "",
    website_url: u.website_url ?? "",
    admissions_url: u.admissions_url ?? "",
    admission_test: u.admission_test ?? "",
    admissions_window: u.admissions_window ?? "",
    fee_min_pkr: u.fee_min_pkr?.toString() ?? "",
    fee_max_pkr: u.fee_max_pkr?.toString() ?? "",
    fee_note: u.fee_note ?? "",
    how_to_apply: u.how_to_apply ?? "",
    required_documents: lines(u.required_documents),
    source_url: u.source_url ?? "",
    programmes: programmes.map((p) => ({
      key: p.id,
      field_id: p.field_id ?? "",
      name: p.name,
      level: p.level,
      entry_requirements: p.entry_requirements ?? "",
      entry_test: p.entry_test ?? "",
    })),
  };
}

export function scholarshipToValues(s: Scholarship, fieldIds: string[]): ScholarshipValues {
  return {
    name: s.name,
    slug: s.slug,
    provider: s.provider,
    scope: s.scope,
    kind: s.kind,
    women_only: s.women_only,
    audience_note: s.audience_note ?? "",
    summary: s.summary ?? "",
    who_its_for: s.who_its_for ?? "",
    what_it_covers: s.what_it_covers ?? "",
    covers: lines(s.covers),
    eligible_areas: lines(s.eligible_areas),
    field_ids: fieldIds,
    deadline: s.deadline ?? "",
    deadline_note: s.deadline_note ?? "",
    how_to_apply: s.how_to_apply ?? "",
    official_url: s.official_url ?? "",
    source_url: s.source_url ?? "",
  };
}

// ---------------------------------------------------------------------------
// Reading what the browser sent (never trusted: every value is re-shaped)
// ---------------------------------------------------------------------------

const str = (value: unknown) => (typeof value === "string" ? value : "");
const bool = (value: unknown) => value === true;
const oneOf = <T extends string>(value: unknown, options: readonly T[], fallback: T): T =>
  options.includes(value as T) ? (value as T) : fallback;
const yesNoOptions = ["", "yes", "no"] as const;
// Plenty for any real entry; stops a runaway form.
const MAX_ROWS = 100;

export function parseUniversity(raw: unknown): UniversityValues {
  const r = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const programmes = Array.isArray(r.programmes) ? r.programmes.slice(0, MAX_ROWS) : [];
  return {
    name: str(r.name),
    short_name: str(r.short_name),
    slug: str(r.slug),
    city: str(r.city),
    campuses_note: str(r.campuses_note),
    province: str(r.province),
    type: oneOf(r.type, ["", "public", "private"] as const, ""),
    hec_recognised: bool(r.hec_recognised),
    women_only: bool(r.women_only),
    has_hostel: oneOf(r.has_hostel, yesNoOptions, ""),
    need_based_aid: oneOf(r.need_based_aid, yesNoOptions, ""),
    overview: str(r.overview),
    website_url: str(r.website_url),
    admissions_url: str(r.admissions_url),
    admission_test: str(r.admission_test),
    admissions_window: str(r.admissions_window),
    fee_min_pkr: str(r.fee_min_pkr),
    fee_max_pkr: str(r.fee_max_pkr),
    fee_note: str(r.fee_note),
    how_to_apply: str(r.how_to_apply),
    required_documents: str(r.required_documents),
    source_url: str(r.source_url),
    programmes: programmes.map((p, i) => {
      const row = (p && typeof p === "object" ? p : {}) as Record<string, unknown>;
      return {
        key: str(row.key) || String(i),
        field_id: str(row.field_id),
        name: str(row.name),
        level: str(row.level),
        entry_requirements: str(row.entry_requirements),
        entry_test: str(row.entry_test),
      };
    }),
  };
}

const scholarshipKinds = ["government", "need", "merit", "university", "external"] as const;

export function parseScholarship(raw: unknown): ScholarshipValues {
  const r = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const fieldIds = Array.isArray(r.field_ids) ? r.field_ids.filter((id) => typeof id === "string") : [];
  return {
    name: str(r.name),
    slug: str(r.slug),
    provider: str(r.provider),
    scope: oneOf(r.scope, ["pakistan", "international"] as const, "pakistan"),
    kind: oneOf(r.kind, ["", ...scholarshipKinds] as const, ""),
    women_only: bool(r.women_only),
    audience_note: str(r.audience_note),
    summary: str(r.summary),
    who_its_for: str(r.who_its_for),
    what_it_covers: str(r.what_it_covers),
    covers: str(r.covers),
    eligible_areas: str(r.eligible_areas),
    field_ids: fieldIds.slice(0, MAX_ROWS),
    deadline: str(r.deadline),
    deadline_note: str(r.deadline_note),
    how_to_apply: str(r.how_to_apply),
    official_url: str(r.official_url),
    source_url: str(r.source_url),
  };
}

// ---------------------------------------------------------------------------
// Checking
// ---------------------------------------------------------------------------

/**
 * What the person asked for: save as a draft, publish, update a published
 * entry, move it back to drafts, or save and mark it as verified.
 */
export type SaveIntent = "draft" | "publish" | "update" | "unpublish" | "verify";

export const isSaveIntent = (value: unknown): value is SaveIntent =>
  value === "draft" ||
  value === "publish" ||
  value === "update" ||
  value === "unpublish" ||
  value === "verify";

/** The status an entry ends up with. */
export function statusFor(intent: SaveIntent, current: ContentStatus | null): ContentStatus {
  if (intent === "publish") return "published";
  if (intent === "draft" || intent === "unpublish") return "draft";
  return current ?? "draft";
}

/** Field errors keyed by field name; programme rows use "programmes.0.name". */
export type FieldErrors = Record<string, string>;

/** What an editor's save action sends back when nothing was saved (success redirects). */
export type SaveState =
  { status: "idle" } | { status: "invalid"; errors: FieldErrors; form?: string; at: number };

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const isUuid = (value: string) => uuidPattern.test(value);

const SHORT_MAX = 200;
const LONG_MAX = 5000;
const urlPattern = /^https?:\/\/[^\s/$.?#][^\s]*\.[^\s]+$/i;
const datePattern = /^\d{4}-\d{2}-\d{2}$/;
const t = (value: string) => value.trim();

function sourceError(intent: SaveIntent, status: ContentStatus, source: string) {
  if (t(source)) return;
  if (intent === "verify") return "Add the official source link before marking this as verified.";
  if (intent === "publish") return "Add the official source link before publishing.";
  if (status === "published") {
    return "Published entries need an official source link. Add it, or move this entry to drafts.";
  }
}

function urlError(value: string) {
  if (t(value) && !urlPattern.test(t(value))) {
    return "That web address doesn’t look right. It should start with https://";
  }
}

function lengthErrors(errors: FieldErrors, values: Record<string, unknown>, long: string[]) {
  for (const [key, value] of Object.entries(values)) {
    if (typeof value !== "string" || errors[key]) continue;
    const max = long.includes(key) ? LONG_MAX : SHORT_MAX;
    if (t(value).length > max)
      errors[key] = `Please keep this under ${max.toLocaleString("en-GB")} characters.`;
  }
}

function slugError(slug: string) {
  if (!t(slug)) return "Please enter a web address for this page.";
  if (t(slug).length > SLUG_MAX) return `Please keep the web address under ${SLUG_MAX} characters.`;
  if (!slugPattern.test(t(slug))) {
    return "Use lowercase letters, numbers and single hyphens only, for example quaid-i-azam-university.";
  }
}

function feeError(value: string) {
  if (!t(value)) return;
  const n = Number(t(value).replace(/[,\s]/g, ""));
  if (!Number.isInteger(n) || n < 0 || n > 100_000_000) {
    return "Please enter the fee in rupees as a whole number, for example 45000.";
  }
}

const feeNumber = (value: string) => (t(value) ? Number(t(value).replace(/[,\s]/g, "")) : null);

export function validateUniversity(v: UniversityValues, intent: SaveIntent, status: ContentStatus) {
  const errors: FieldErrors = {};
  const set = (key: string, message: string | undefined) => {
    if (message) errors[key] = message;
  };
  set("name", t(v.name) ? undefined : "Please enter the university’s name.");
  set("slug", slugError(v.slug));
  set("city", t(v.city) ? undefined : "Please enter the city.");
  set("website_url", urlError(v.website_url));
  set("admissions_url", urlError(v.admissions_url));
  set("source_url", urlError(v.source_url) ?? sourceError(intent, status, v.source_url));
  set("fee_min_pkr", feeError(v.fee_min_pkr));
  set("fee_max_pkr", feeError(v.fee_max_pkr));
  const min = feeNumber(v.fee_min_pkr);
  const max = feeNumber(v.fee_max_pkr);
  if (!errors.fee_min_pkr && !errors.fee_max_pkr && min != null && max != null && max < min) {
    errors.fee_max_pkr = "The highest fee can’t be less than the lowest.";
  }
  if (v.short_name.trim().length > 20) errors.short_name = "Please keep the short name under 20 characters.";
  const { programmes, ...rest } = v;
  lengthErrors(errors, rest, ["overview", "how_to_apply", "required_documents"]);
  programmes.forEach((p, i) => {
    if (!t(p.name)) errors[`programmes.${i}.name`] = "Please enter the programme’s name, or remove this row.";
    else if (t(p.name).length > SHORT_MAX)
      errors[`programmes.${i}.name`] = "Please keep this under 200 characters.";
  });
  return errors;
}

export function validateScholarship(v: ScholarshipValues, intent: SaveIntent, status: ContentStatus) {
  const errors: FieldErrors = {};
  const set = (key: string, message: string | undefined) => {
    if (message) errors[key] = message;
  };
  set("name", t(v.name) ? undefined : "Please enter the scholarship’s name.");
  set("slug", slugError(v.slug));
  set("provider", t(v.provider) ? undefined : "Please enter who offers this scholarship.");
  set("kind", v.kind ? undefined : "Please choose the type of support.");
  set("official_url", urlError(v.official_url));
  set("source_url", urlError(v.source_url) ?? sourceError(intent, status, v.source_url));
  if (t(v.deadline) && (!datePattern.test(t(v.deadline)) || Number.isNaN(Date.parse(t(v.deadline))))) {
    errors.deadline = "Please enter a real date, for example 31/03/2027.";
  }
  lengthErrors(errors, v, ["summary", "who_its_for", "what_it_covers", "how_to_apply", "eligible_areas"]);
  return errors;
}

/** Labels for the error summary, in the order the fields appear. */
export const universityLabels: Record<string, string> = {
  name: "University name",
  short_name: "Short name",
  slug: "Web address",
  city: "City",
  campuses_note: "Campuses",
  overview: "Overview",
  website_url: "Official website",
  admissions_url: "Admissions page",
  admission_test: "Admission test",
  admissions_window: "Application window",
  fee_min_pkr: "Lowest fee per semester",
  fee_max_pkr: "Highest fee per semester",
  fee_note: "Fee note",
  how_to_apply: "How to apply",
  required_documents: "Documents needed",
  source_url: "Official source link",
};

export const scholarshipLabels: Record<string, string> = {
  name: "Scholarship name",
  slug: "Web address",
  provider: "Offered by",
  kind: "Type of support",
  audience_note: "Who it’s mainly for",
  summary: "Summary",
  who_its_for: "Eligibility",
  what_it_covers: "What it covers",
  covers: "Covers (short labels)",
  eligible_areas: "Eligible subjects or areas",
  deadline: "Deadline",
  deadline_note: "Deadline note",
  how_to_apply: "How to apply",
  official_url: "Official link",
  source_url: "Official source link",
};

/** Error summary entries, in form order: [field key, label, message]. */
export function errorList(errors: FieldErrors, labels: Record<string, string>) {
  const order = Object.keys(labels);
  const rank = (key: string) => {
    const i = order.indexOf(key.split(".")[0]);
    return i === -1 ? order.length : i;
  };
  return Object.keys(errors)
    .sort((a, b) => rank(a) - rank(b))
    .map((key) => {
      const programme = key.match(/^programmes\.(\d+)\./);
      const label = programme ? `Programme ${Number(programme[1]) + 1}` : (labels[key] ?? key);
      return { key, label, message: errors[key] };
    });
}

// ---------------------------------------------------------------------------
// Database rows
// ---------------------------------------------------------------------------

const orNull = (value: string) => t(value) || null;
// One item per line: items can contain commas.
const list = (value: string) =>
  value
    .split(/\r?\n/)
    .map((item) => item.trim())
    .filter(Boolean);
const yesNoValue = (value: YesNo) => (value === "" ? null : value === "yes");

export function universityRow(v: UniversityValues, status: ContentStatus) {
  return {
    values: {
      name: t(v.name),
      short_name: orNull(v.short_name),
      slug: t(v.slug),
      city: t(v.city),
      campuses_note: orNull(v.campuses_note),
      province: orNull(v.province),
      type: v.type || null,
      hec_recognised: v.hec_recognised,
      women_only: v.women_only,
      has_hostel: yesNoValue(v.has_hostel),
      need_based_aid: yesNoValue(v.need_based_aid),
      overview: orNull(v.overview),
      website_url: orNull(v.website_url),
      admissions_url: orNull(v.admissions_url),
      admission_test: orNull(v.admission_test),
      admissions_window: orNull(v.admissions_window),
      fee_min_pkr: feeNumber(v.fee_min_pkr),
      fee_max_pkr: feeNumber(v.fee_max_pkr),
      fee_note: orNull(v.fee_note),
      how_to_apply: orNull(v.how_to_apply),
      required_documents: list(v.required_documents),
      source_url: orNull(v.source_url),
      status,
    },
    programmes: v.programmes.map((p) => ({
      field_id: p.field_id || null,
      name: t(p.name),
      level: t(p.level) || "Undergraduate",
      entry_requirements: orNull(p.entry_requirements),
      entry_test: orNull(p.entry_test),
    })),
  };
}

export function scholarshipRow(v: ScholarshipValues, status: ContentStatus) {
  return {
    values: {
      name: t(v.name),
      slug: t(v.slug),
      provider: t(v.provider),
      scope: v.scope,
      kind: v.kind,
      women_only: v.women_only,
      audience_note: orNull(v.audience_note),
      summary: orNull(v.summary),
      who_its_for: orNull(v.who_its_for),
      what_it_covers: orNull(v.what_it_covers),
      covers: list(v.covers),
      eligible_areas: list(v.eligible_areas),
      deadline: orNull(v.deadline),
      deadline_note: orNull(v.deadline_note),
      how_to_apply: orNull(v.how_to_apply),
      official_url: orNull(v.official_url),
      source_url: orNull(v.source_url),
      status,
    },
    fieldIds: v.field_ids,
  };
}
