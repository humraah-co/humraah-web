import type { Metadata } from "next";
import { EntryList, readListParams } from "@/components/admin/EntryList";
import { listEntries, teamNames } from "@/lib/admin/entries";
import { requireActiveMember } from "@/lib/admin/session";

export const metadata: Metadata = { title: "Universities" };

type Search = Record<string, string | string[] | undefined>;

/** Admin – Universities (Figma 35:3144). */
export default async function UniversitiesPage({ searchParams }: { searchParams: Promise<Search> }) {
  const { supabase } = await requireActiveMember();
  const [raw, rows, names] = await Promise.all([
    searchParams,
    listEntries(supabase, "universities"),
    teamNames(supabase),
  ]);
  const deleted = raw.notice === "deleted" && typeof raw.name === "string" ? raw.name : null;
  return (
    <EntryList
      table="universities"
      rows={rows}
      names={names}
      params={readListParams(raw)}
      notice={deleted ? `${deleted} was deleted permanently.` : undefined}
    />
  );
}
