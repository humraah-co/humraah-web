/** Display helpers shared by cards and detail pages. */

import type { Locale } from "@/i18n/config";

// English dates read "12 Oct 2026". Urdu uses Urdu month names with the
// everyday Latin digits Pakistani readers expect (25 اکتوبر 2026).
const dateLocale = (locale: Locale) => (locale === "ur" ? "ur-PK-u-nu-latn" : "en-GB");
const formats = new Map<string, Intl.DateTimeFormat>();
function dateFormat(locale: Locale, withYear: boolean) {
  const key = `${locale}-${withYear}`;
  let format = formats.get(key);
  if (!format) {
    format = new Intl.DateTimeFormat(dateLocale(locale), {
      day: "numeric",
      month: "short",
      ...(withYear ? { year: "numeric" } : {}),
      timeZone: "Asia/Karachi",
    });
    formats.set(key, format);
  }
  return format;
}

export function formatShortDate(iso: string, locale: Locale = "en") {
  return dateFormat(locale, false).format(new Date(iso));
}

export function formatLongDate(iso: string, locale: Locale = "en") {
  return dateFormat(locale, true).format(new Date(iso));
}

/**
 * "Rs 45,000" or "Rs 45,000 to Rs 60,000". `range` is the wording around
 * the two amounts, with {min} and {max} (from the messages, so Urdu can
 * read "Rs 45,000 سے Rs 60,000 تک").
 */
export function formatFeeRange(min: number | null, max: number | null, range = "{min} to {max}") {
  const rs = (n: number) => `Rs ${n.toLocaleString("en-PK")}`;
  if (min == null && max == null) return null;
  if (min != null && max != null && min !== max)
    return range.replace("{min}", rs(min)).replace("{max}", rs(max));
  return rs((min ?? max)!);
}

/** Joins a list as "a, b and c" (in Urdu "a، b اور c"). */
export function joinWithAnd(items: string[], locale: "en" | "ur" = "en") {
  if (items.length <= 1) return items.join("");
  const [comma, and] = locale === "ur" ? ["، ", "اور"] : [", ", "and"];
  return `${items.slice(0, -1).join(comma)} ${and} ${items.at(-1)}`;
}

/** The 2–4 letter avatar label for a university card. */
export function initialsFor(name: string, shortName: string | null) {
  if (shortName && shortName.length <= 5) return shortName;
  return name
    .split(/\s+/)
    .filter((w) => /^[A-Z]/.test(w))
    .map((w) => w[0])
    .join("")
    .slice(0, 4);
}

/** Days from today (Pakistan time) to an ISO date; negative once it has passed. */
export function daysUntil(isoDate: string, now = new Date()) {
  const today = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Karachi" }));
  today.setHours(0, 0, 0, 0);
  const target = new Date(`${isoDate}T00:00:00`);
  return Math.round((target.getTime() - today.getTime()) / 86_400_000);
}

const countWords = ["no", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten"];

/** "ten" for 10, "12" past that: how a short count reads in a sentence. */
export function countWord(n: number) {
  return countWords[n] ?? String(n);
}

/** One step per line, with any "1." or "-" marker removed. */
export function stepsFrom(text: string | null) {
  return (text ?? "")
    .split(/\r?\n/)
    .map((line) => line.replace(/^\s*(?:\d+[.)]|[-*•])\s*/, "").trim())
    .filter(Boolean);
}

/** Points for a checklist: one per line, or one per sentence when the text is a single line. */
export function pointsFrom(text: string | null) {
  const lines = stepsFrom(text);
  if (lines.length !== 1) return lines;
  return (
    lines[0]
      // English sentences end in . ! ? before a capital or digit; Urdu ones in ۔ or ؟ before anything.
      .split(/(?<=[.!?])\s+(?=[A-Z0-9])|(?<=[۔؟])\s+/)
      .map((s) => s.replace(/[.۔]$/, "").trim())
      .filter(Boolean)
  );
}

/** Six months: after this a verified entry may be out of date. */
export const STALE_AFTER_MONTHS = 6;

/** True when an entry was verified, but more than six months ago. */
export function isStale(verifiedAt: string | null, now = new Date()) {
  if (!verifiedAt) return false;
  const limit = new Date(verifiedAt);
  limit.setMonth(limit.getMonth() + STALE_AFTER_MONTHS);
  return limit.getTime() < now.getTime();
}

/** Reading time in minutes at about 200 words a minute, never less than one. Counts Urdu words too. */
export function readMinutes(markdown: string) {
  const words = markdown.split(/\s+/).filter((w) => /[\p{L}\p{N}]/u.test(w)).length;
  return Math.max(1, Math.ceil(words / 200));
}

/** "hec.gov.pk" from "https://www.hec.gov.pk/english"; the raw value if it isn't a URL. */
export function hostOf(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

/** "Just now", "3 hours ago", "Yesterday", "4 days ago", then the date. */
export function timeAgo(iso: string, now = new Date()) {
  const minutes = Math.floor((now.getTime() - new Date(iso).getTime()) / 60_000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return minutes === 1 ? "1 minute ago" : `${minutes} minutes ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return hours === 1 ? "1 hour ago" : `${hours} hours ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  return formatLongDate(iso);
}

/** "RA" for "Researcher A", "IK" for "ina.khan@…": the letters on a person's avatar. */
export function personInitials(name: string) {
  const words = name
    .split(/[\s._@-]+/)
    .filter(Boolean)
    .slice(0, 2);
  return words.map((w) => w[0]!.toUpperCase()).join("") || "?";
}

/** "Today", "Yesterday", "3 days ago", then the date: for "last active". */
export function dayLabel(iso: string, now = new Date()) {
  const day = (d: Date) =>
    new Date(d.toLocaleString("en-US", { timeZone: "Asia/Karachi" })).setHours(0, 0, 0, 0);
  const days = Math.round((day(now) - day(new Date(iso))) / 86_400_000);
  if (days <= 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 30) return `${days} days ago`;
  return formatLongDate(iso);
}

/** "Saved 3 minutes ago by Ina Khan", "Saved yesterday", "Saved 12 Oct 2026". */
export function savedLine(iso: string, by?: string, now = new Date()) {
  const ago = timeAgo(iso, now);
  const when = /^\d/.test(ago) ? ago : ago[0].toLowerCase() + ago.slice(1);
  return `Saved ${when}${by ? ` by ${by}` : ""}`;
}
