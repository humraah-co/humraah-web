import "server-only";
import type { Locale } from "@/i18n/config";
import { searchContent, type SearchGroup } from "@/lib/search";
import {
  listFields,
  listGuidanceArticles,
  listResources,
  listScholarshipCards,
  listUniversityCards,
} from "./public";

/**
 * Searches the published content in one language. It reads the same cached
 * lists the pages use (anon client, so only published rows), so a search is
 * not a database query of its own. Returns null when Supabase isn't set up.
 */
export async function searchSite(query: string, locale: Locale): Promise<SearchGroup[] | null> {
  const [universities, scholarships, fields, guidance, resources] = await Promise.all([
    listUniversityCards(locale),
    listScholarshipCards(locale),
    listFields(locale),
    listGuidanceArticles(locale),
    listResources(locale),
  ]);
  if (!universities && !scholarships && !fields && !guidance && !resources) return null;
  return searchContent(query, { universities, scholarships, fields, guidance, resources });
}
