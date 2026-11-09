/**
 * Upcoming deadlines for the notifications bell.
 *
 * Scholarships have a real date column (`deadline`). Universities only have
 * `admissions_window`, a short free-text line such as "Applications close
 * 30 April 2027", so a date is read from it only when it names a full day,
 * month and year (or an ISO date). When the text names several dates the
 * last one is used, since that is when applications close. Anything vaguer
 * ("Spring and Fall", "dates to be confirmed") has no confirmed date and is
 * never listed or counted.
 *
 * Pure functions, so the rules can be tested without a database.
 */

import { daysUntil } from "./format.ts";

export type DeadlineKind = "scholarship" | "admission";

export type Deadline = {
  kind: DeadlineKind;
  /** The entry's slug, for its page: /scholarships/<slug> or /universities/<slug>. */
  slug: string;
  name: string;
  /** The closing day as YYYY-MM-DD. */
  date: string;
  /** True once a researcher has verified the entry; false shows "Not yet verified". */
  verified: boolean;
};

/** The badge counts deadlines this many days away or sooner. */
export const SOON_DAYS = 30;

const MONTHS = [
  "january",
  "february",
  "march",
  "april",
  "may",
  "june",
  "july",
  "august",
  "september",
  "october",
  "november",
  "december",
];

/** The month (0 to 11) for "April", "Apr" or "Apr." ("Sept" too), or -1 for any other word. */
function monthIndex(word: string) {
  const w = word.toLowerCase().replace(/\.$/, "");
  if (w === "sept") return 8;
  return MONTHS.findIndex((m) => m === w || (w.length === 3 && m.startsWith(w)));
}

/** YYYY-MM-DD if the three numbers are a real calendar day, else null. */
function isoDate(year: number, month: number, day: number) {
  const d = new Date(Date.UTC(year, month, day));
  if (d.getUTCFullYear() !== year || d.getUTCMonth() !== month || d.getUTCDate() !== day) return null;
  return d.toISOString().slice(0, 10);
}

/**
 * The closing date in an admissions-window line: the last full date it
 * names, in "30 April 2027", "30th Apr, 2027", "April 30, 2027" or
 * "2027-04-30" form. null when there is none.
 */
export function parseAdmissionDate(text: string | null | undefined): string | null {
  if (!text) return null;
  const found: string[] = [];
  const add = (date: string | null) => {
    if (date) found.push(date);
  };

  for (const m of text.matchAll(/\b(\d{4})-(\d{2})-(\d{2})\b/g)) {
    add(isoDate(+m[1], +m[2] - 1, +m[3]));
  }
  // 30 April 2027, 30th Apr, 2027
  for (const m of text.matchAll(/\b(\d{1,2})(?:st|nd|rd|th)?\s+([A-Za-z]{3,9}\.?),?\s+(\d{4})\b/g)) {
    const month = monthIndex(m[2]);
    if (month >= 0) add(isoDate(+m[3], month, +m[1]));
  }
  // April 30, 2027
  for (const m of text.matchAll(/\b([A-Za-z]{3,9}\.?)\s+(\d{1,2})(?:st|nd|rd|th)?,?\s+(\d{4})\b/g)) {
    const month = monthIndex(m[1]);
    if (month >= 0) add(isoDate(+m[3], month, +m[2]));
  }
  if (found.length === 0) return null;
  // The latest date, whatever order the line names them in.
  return found.sort()[found.length - 1];
}

type ScholarshipRow = {
  slug: string;
  name: string;
  deadline: string | null;
  last_verified_at: string | null;
};
type UniversityRow = {
  slug: string;
  name: string;
  admissions_window: string | null;
  last_verified_at: string | null;
};

/** Every dated scholarship and university, unsorted and not yet limited to the future. */
export function toDeadlines(scholarships: ScholarshipRow[], universities: UniversityRow[]): Deadline[] {
  const out: Deadline[] = [];
  for (const s of scholarships) {
    if (s.deadline) {
      out.push({
        kind: "scholarship",
        slug: s.slug,
        name: s.name,
        date: s.deadline,
        verified: !!s.last_verified_at,
      });
    }
  }
  for (const u of universities) {
    const date = parseAdmissionDate(u.admissions_window);
    if (date) {
      out.push({ kind: "admission", slug: u.slug, name: u.name, date, verified: !!u.last_verified_at });
    }
  }
  return out;
}

/** Deadlines that have not passed (today counts), soonest first, then by name. */
export function upcoming(deadlines: Deadline[], now = new Date()): Deadline[] {
  return deadlines
    .filter((d) => daysUntil(d.date, now) >= 0)
    .sort((a, b) => a.date.localeCompare(b.date) || a.name.localeCompare(b.name));
}

/** How many of the (upcoming) deadlines fall within the next 30 days. */
export function soonCount(deadlines: Deadline[], now = new Date()): number {
  return deadlines.filter((d) => {
    const days = daysUntil(d.date, now);
    return days >= 0 && days <= SOON_DAYS;
  }).length;
}

/** The two groups the panel shows, in order; a group with no deadlines is left out. */
export function groupDeadlines(deadlines: Deadline[]) {
  return (["scholarship", "admission"] as const)
    .map((kind) => ({ kind, items: deadlines.filter((d) => d.kind === kind) }))
    .filter((g) => g.items.length > 0);
}
