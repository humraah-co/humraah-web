import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { EntryConfirm } from "@/components/admin/EntryConfirm";
import { ResourceEditor } from "@/components/admin/ResourceEditor";
import { RecentChanges } from "@/components/admin/RecentChanges";
import { PageHeader } from "@/components/admin/Workspace";
import { FormAlert } from "@/components/ui/Field";
import { isUuid } from "@/lib/admin/content";
import { entryActivity, getResourceForEdit, lastVerifier, teamNames } from "@/lib/admin/entries";
import { editorNotice } from "@/lib/admin/saveEntry";
import { getSessionClient, requireActiveMember } from "@/lib/admin/session";
import { isAdminRole } from "@/lib/admin/team";
import { resourceToValues } from "@/lib/admin/siteContent";
import { savedLine } from "@/lib/format";

export const metadata: Metadata = { title: "Edit resource" };

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function EditResourcesPage({ params, searchParams }: Props) {
  const supabase = await getSessionClient();
  const [{ id }, query] = await Promise.all([params, searchParams]);
  if (!isUuid(id)) notFound();

  // Loaded alongside the membership check; nothing renders until it passes.
  const [{ member }, entry, recent, verifier, names] = await Promise.all([
    requireActiveMember(),
    getResourceForEdit(supabase, id),
    entryActivity(supabase, "resources", id),
    lastVerifier(supabase, "resources", id),
    teamNames(supabase),
  ]);
  if (entry === null) {
    return (
      <>
        <PageHeader title="Edit resource" description="Update this link." />
        <FormAlert>We couldn’t load this resource. Please refresh the page.</FormAlert>
      </>
    );
  }
  if (!entry) notFound();
  const e = entry;
  const editor = e.updated_by ? names.get(e.updated_by) : undefined;
  const isAdmin = isAdminRole(member.role);

  return (
    <>
      <ResourceEditor
        // A fresh form after every save, so "unsaved changes" starts from what was saved.
        key={e.updated_at}
        meta={{
          table: "resources",
          id: e.id,
          status: e.status,
          title: e.title,
          savedLine: savedLine(e.updated_at, editor),
          verifiedAt: e.last_verified_at,
          verifiedBy: verifier ? names.get(verifier) : undefined,
          viewHref: e.status === "published" ? "/resources" : undefined,
          isAdmin,
        }}
        initial={resourceToValues(e)}
        notice={editorNotice(query)}
        recent={<RecentChanges entries={recent} actors={names} />}
      />
      <EntryConfirm
        table="resources"
        entry={{ id: e.id, name: e.title, status: e.status }}
        confirm={query.confirm}
        error={query.error}
        isAdmin={isAdmin}
      />
    </>
  );
}
