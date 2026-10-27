import type { MetadataRoute } from "next";
import { urduEnabled } from "@/i18n/config";
import {
  listFields,
  listGuidanceArticles,
  listScholarshipCards,
  listUniversityCards,
} from "@/lib/data/public";
import { siteUrl } from "@/lib/indexing";
import { buildSitemap } from "@/lib/sitemap";

// Same refresh as the pages it lists.
export const revalidate = 300;

/**
 * Lists the published public pages. The public queries go through the anon
 * client, so row-level security returns published entries only; drafts and
 * archived entries never appear. Without a database connection (the CI
 * build) only the fixed pages are listed.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [universities, scholarships, fields, guidance] = await Promise.all([
    listUniversityCards("en"),
    listScholarshipCards("en"),
    listFields("en"),
    listGuidanceArticles("en"),
  ]);
  const slugs = (rows: { slug: string }[] | null) => rows?.map((r) => r.slug) ?? [];
  return buildSitemap(
    siteUrl(),
    {
      universities: slugs(universities),
      scholarships: slugs(scholarships),
      fields: slugs(fields),
      guidance: slugs(guidance),
    },
    urduEnabled(),
  );
}
