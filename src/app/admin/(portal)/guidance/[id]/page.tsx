import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { EntryConfirm } from "@/components/admin/EntryConfirm";
import { GuidanceEditor } from "@/components/admin/GuidanceEditor";
import { RecentChanges } from "@/components/admin/RecentChanges";
import { PageHeader } from "@/components/admin/Workspace";
import { FormAlert } from "@/components/ui/Field";
import { isUuid } from "@/lib/admin/content";
import { entryActivity, getGuidanceForEdit, lastVerifier, teamNames } from "@/lib/admin/entries";
import { editorNotice } from "@/lib/admin/saveEntry";
import { getSessionClient, requireActiveMember } from "@/lib/admin/session";
import { isAdminRole } from "@/lib/admin/team";
import { guidanceToValues } from "@/lib/admin/siteContent";
import { savedLine } from "@/lib/format";

export const metadata: Metadata = { title: "Edit guidance article" };

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function EditGuidanceArticlesPage({ params, searchParams }: Props) {
  const supabase = await getSessionClient();
  const [{ id }, query] = await Promise.all([params, searchParams]);
  if (!isUuid(id)) notFound();

  // Loaded alongside the membership check; nothing renders until it passes.
  const [{ member }, entry, recent, verifier, names] = await Promise.all([
    requireActiveMember(),
    getGuidanceForEdit(supabase, id),
    entryActivity(supabase, "guidance_articles", id),
    lastVerifier(supabase, "guidance_articles", id),
    teamNames(supabase),
  ]);
  if (entry === null) {
    return (
      <>
        <PageHeader title="Edit guidance article" description="Update this article." />
        <FormAlert>We couldn’t load this guidance article. Please refresh the page.</FormAlert>
      </>
    );
  }
  if (!entry) notFound();
  const e = entry;
  const editor = e.updated_by ? names.get(e.updated_by) : undefined;
  const isAdmin = isAdminRole(member.role);

  return (
    <>
      <GuidanceEditor
        // A fresh form after every save, so "unsaved changes" starts from what was saved.
        key={e.updated_at}
        meta={{
          table: "guidance_articles",
          id: e.id,
          status: e.status,
          title: e.title,
          savedLine: savedLine(e.updated_at, editor),
          verifiedAt: e.last_verified_at,
          verifiedBy: verifier ? names.get(verifier) : undefined,
          viewHref: e.status === "published" ? `/guidance/${e.slug}` : undefined,
          isAdmin,
        }}
        initial={guidanceToValues(e)}
        notice={editorNotice(query)}
        recent={<RecentChanges entries={recent} actors={names} />}
      />
      <EntryConfirm
        table="guidance_articles"
        entry={{ id: e.id, name: e.title, status: e.status }}
        confirm={query.confirm}
        error={query.error}
        isAdmin={isAdmin}
      />
    </>
  );
}
