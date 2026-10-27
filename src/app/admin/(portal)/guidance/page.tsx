import type { Metadata } from "next";
import { EntryList, readListParams } from "@/components/admin/EntryList";
import { listEntries, teamNames } from "@/lib/admin/entries";
import { getSessionClient, requireActiveMember } from "@/lib/admin/session";

export const metadata: Metadata = { title: "Guidance articles" };

type Search = Record<string, string | string[] | undefined>;

export default async function GuidanceArticlesPage({ searchParams }: { searchParams: Promise<Search> }) {
  const supabase = await getSessionClient();
  // Loaded alongside the membership check; nothing renders until it passes.
  const [, raw, rows, names] = await Promise.all([
    requireActiveMember(),
    searchParams,
    listEntries(supabase, "guidance_articles"),
    teamNames(supabase),
  ]);
  const deleted = raw.notice === "deleted" && typeof raw.name === "string" ? raw.name : null;
  return (
    <EntryList
      table="guidance_articles"
      rows={rows}
      names={names}
      params={readListParams(raw)}
      notice={deleted ? `${deleted} was deleted permanently.` : undefined}
    />
  );
}
