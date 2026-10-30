/**
 * Urdu content with an English fallback. A row loaded for an Urdu page
 * carries both versions of each text (`summary` and `summary_ur`).
 * localize() keeps the Urdu where there is some, and keeps the English
 * where there isn't, listing those fields in `english` so the page can mark
 * them as English (lang="en", and an "Available in English" note).
 *
 * `english` is a plain list, not a Set, so the result survives the data
 * cache (which stores JSON).
 *
 * No framework imports here, so the tests can load this file directly.
 */

export type WithEnglish<K extends string = string> = {
  /** Fields shown in English because they have no Urdu yet. Empty on English pages. */
  english: K[];
};

const hasText = (value: unknown) =>
  Array.isArray(value)
    ? value.some((v) => typeof v === "string" && v.trim() !== "")
    : typeof value === "string" && value.trim() !== "";

/**
 * Picks the Urdu version of each of `fields` where it exists. Fields listed
 * in `names` (a university's name, say) switch to Urdu when there is a
 * well-known Urdu name but are never reported as English, since names
 * normally stay in English. Every `_ur` key is removed from the result.
 */
export function localize<T extends object, K extends string & keyof T>(
  row: T,
  fields: readonly K[],
  names: readonly (string & keyof T)[] = [],
): Omit<T, `${string}_ur`> & WithEnglish<K> {
  const source = row as Record<string, unknown>;
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(source)) if (!key.endsWith("_ur")) result[key] = value;
  const english: K[] = [];
  for (const field of [...fields, ...names]) {
    const urdu = source[`${field}_ur`];
    if (hasText(urdu)) result[field] = urdu;
    else if (hasText(source[field]) && (fields as readonly string[]).includes(field))
      english.push(field as K);
  }
  result.english = english;
  return result as Omit<T, `${string}_ur`> & WithEnglish<K>;
}

/** The same row on an English page: nothing is marked. */
export function asEnglish<T extends object>(row: T): T & WithEnglish<never> {
  return { ...row, english: [] };
}
