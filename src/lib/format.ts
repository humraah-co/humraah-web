/** Display helpers shared by cards and detail pages. */

const shortDate = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  timeZone: "Asia/Karachi",
});
const longDate = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "Asia/Karachi",
});

export function formatShortDate(iso: string) {
  return shortDate.format(new Date(iso));
}

export function formatLongDate(iso: string) {
  return longDate.format(new Date(iso));
}

/** "Rs 45,000" or "Rs 45,000 to Rs 60,000". */
export function formatFeeRange(min: number | null, max: number | null) {
  const rs = (n: number) => `Rs ${n.toLocaleString("en-PK")}`;
  if (min == null && max == null) return null;
  if (min != null && max != null && min !== max) return `${rs(min)} to ${rs(max)}`;
  return rs((min ?? max)!);
}

/** Joins a list as "a, b and c". */
export function joinWithAnd(items: string[]) {
  if (items.length <= 1) return items.join("");
  return `${items.slice(0, -1).join(", ")} and ${items.at(-1)}`;
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
