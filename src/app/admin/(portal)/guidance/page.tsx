import type { Metadata } from "next";
import { EntryList, readListParams } from "@/components/admin/EntryList";
import { GuidanceTypeSwitch, type GuidanceType } from "@/components/admin/GuidanceTypeSwitch";
import { listEntries, teamNames } from "@/lib/admin/entries";
import { getSessionClient, requireActiveMember } from "@/lib/admin/session";

export const metadata: Metadata = { title: "Guidance and resources" };

type Search = Record<string, string | string[] | undefined>;

const heading = {
  articles: {
    title: "Guidance and resources",
    description:
      "The step-by-step guidance articles. Write in plain language and check each claim at its source.",
  },
  resources: {
    title: "Guidance and resources",
    description: "The official links on the Guidance page. Every link needs a source you checked.",
  },
};

/** Guidance articles and resources on one page, with a switch between them. */
export default async function GuidanceAndResourcesPage({ searchParams }: { searchParams: Promise<Search> }) {
  const supabase = await getSessionClient();
  // Loaded alongside the membership check; nothing renders until it passes.
  const [, raw, articles, resources, names] = await Promise.all([
    requireActiveMember(),
    searchParams,
    listEntries(supabase, "guidance_articles"),
    listEntries(supabase, "resources"),
    teamNames(supabase),
  ]);
  const type: GuidanceType = raw.type === "resources" ? "resources" : "articles";
  const deleted = raw.notice === "deleted" && typeof raw.name === "string" ? raw.name : null;
  return (
    <EntryList
      table={type === "resources" ? "resources" : "guidance_articles"}
      rows={type === "resources" ? resources : articles}
      names={names}
      params={readListParams(raw)}
      notice={deleted ? `${deleted} was deleted permanently.` : undefined}
      heading={heading[type]}
      listPath="/admin/guidance"
      keep={type === "resources" ? { type: "resources" } : undefined}
      above={
        <GuidanceTypeSwitch
          current={type}
          counts={{ articles: articles?.length ?? null, resources: resources?.length ?? null }}
        />
      }
    />
  );
}
