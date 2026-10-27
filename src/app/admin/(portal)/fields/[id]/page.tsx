import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { EntryConfirm } from "@/components/admin/EntryConfirm";
import { FieldEditor } from "@/components/admin/FieldEditor";
import { RecentChanges } from "@/components/admin/RecentChanges";
import { PageHeader } from "@/components/admin/Workspace";
import { FormAlert } from "@/components/ui/Field";
import { isUuid } from "@/lib/admin/content";
import { entryActivity, getFieldForEdit, lastVerifier, teamNames, fieldUsage } from "@/lib/admin/entries";
import { editorNotice } from "@/lib/admin/saveEntry";
import { getSessionClient, requireActiveMember } from "@/lib/admin/session";
import { isAdminRole } from "@/lib/admin/team";
import { fieldToValues } from "@/lib/admin/siteContent";
import { savedLine } from "@/lib/format";

export const metadata: Metadata = { title: "Edit field of study" };

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function EditFieldsOfStudyPage({ params, searchParams }: Props) {
  const supabase = await getSessionClient();
  const [{ id }, query] = await Promise.all([params, searchParams]);
  if (!isUuid(id)) notFound();

  // Loaded alongside the membership check; nothing renders until it passes.
  const [{ member }, entry, recent, verifier, names, usage] = await Promise.all([
    requireActiveMember(),
    getFieldForEdit(supabase, id),
    entryActivity(supabase, "fields", id),
    lastVerifier(supabase, "fields", id),
    teamNames(supabase),
    // Only the delete box needs this, so other visits skip the extra reads.
    query.confirm === "delete" ? fieldUsage(supabase, id) : undefined,
  ]);
  if (entry === null) {
    return (
      <>
        <PageHeader title="Edit field of study" description="Update this field of study." />
        <FormAlert>We couldn’t load this field of study. Please refresh the page.</FormAlert>
      </>
    );
  }
  if (!entry) notFound();
  const e = entry;
  const editor = e.updated_by ? names.get(e.updated_by) : undefined;
  const isAdmin = isAdminRole(member.role);

  return (
    <>
      <FieldEditor
        // A fresh form after every save, so "unsaved changes" starts from what was saved.
        key={e.updated_at}
        meta={{
          table: "fields",
          id: e.id,
          status: e.status,
          title: e.name,
          savedLine: savedLine(e.updated_at, editor),
          verifiedAt: e.last_verified_at,
          verifiedBy: verifier ? names.get(verifier) : undefined,
          viewHref: e.status === "published" ? `/explore/${e.slug}` : undefined,
          isAdmin,
        }}
        initial={fieldToValues(e)}
        notice={editorNotice(query)}
        recent={<RecentChanges entries={recent} actors={names} />}
      />
      <EntryConfirm
        table="fields"
        entry={{ id: e.id, name: e.name, status: e.status }}
        confirm={query.confirm}
        error={query.error}
        isAdmin={isAdmin}
        usage={usage}
      />
    </>
  );
}
