import type { Metadata } from "next";
import { EntryList, readListParams } from "@/components/admin/EntryList";
import { listEntries, teamNames } from "@/lib/admin/entries";
import { getSessionClient, requireActiveMember } from "@/lib/admin/session";

export const metadata: Metadata = { title: "Fields of study" };

type Search = Record<string, string | string[] | undefined>;

export default async function FieldsOfStudyPage({ searchParams }: { searchParams: Promise<Search> }) {
  const supabase = await getSessionClient();
  // Loaded alongside the membership check; nothing renders until it passes.
  const [, raw, rows, names] = await Promise.all([
    requireActiveMember(),
    searchParams,
    listEntries(supabase, "fields"),
    teamNames(supabase),
  ]);
  const deleted = raw.notice === "deleted" && typeof raw.name === "string" ? raw.name : null;
  return (
    <EntryList
      table="fields"
      rows={rows}
      names={names}
      params={readListParams(raw)}
      notice={deleted ? `${deleted} was deleted permanently.` : undefined}
    />
  );
}
