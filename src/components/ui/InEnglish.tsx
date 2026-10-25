import { useTranslations } from "next-intl";
import type { WithEnglish } from "@/i18n/localize";

/**
 * For content with no Urdu yet, shown in English on an Urdu page. Spread
 * englishAttrs onto the element that holds the text, so it reads left to
 * right in the Latin font and screen readers switch to English. On English
 * pages, and for text that has Urdu, it adds nothing.
 */
export function englishAttrs(row: WithEnglish, field: string) {
  return row.english.includes(field) ? ({ lang: "en", dir: "ltr" } as const) : {};
}

/** "Available in English", shown under longer texts that have no Urdu yet. */
export function EnglishNote({
  row,
  fields,
  className = "",
}: {
  row: WithEnglish;
  /** Shown when any of these fell back to English. */
  fields: string[];
  className?: string;
}) {
  const t = useTranslations("common");
  if (!fields.some((f) => row.english.includes(f))) return null;
  return <p className={`text-caption text-muted ${className}`}>{t("availableInEnglish")}</p>;
}
