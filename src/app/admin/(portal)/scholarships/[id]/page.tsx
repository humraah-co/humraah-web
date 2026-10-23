import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { EntryConfirm } from "@/components/admin/EntryConfirm";
import { RecentChanges } from "@/components/admin/RecentChanges";
import { ScholarshipEditor } from "@/components/admin/ScholarshipEditor";
import { PageHeader } from "@/components/admin/Workspace";
import { FormAlert } from "@/components/ui/Field";
import { isUuid, scholarshipToValues } from "@/lib/admin/content";
import {
  entryActivity,
  getScholarshipForEdit,
  lastVerifier,
  listFieldOptions,
  teamNames,
} from "@/lib/admin/entries";
import { editorNotice } from "@/lib/admin/saveEntry";
import { requireActiveMember } from "@/lib/admin/session";
import { isAdminRole } from "@/lib/admin/team";
import { savedLine } from "@/lib/format";

export const metadata: Metadata = { title: "Edit scholarship" };

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function EditScholarshipPage({ params, searchParams }: Props) {
  const { supabase, member } = await requireActiveMember();
  const [{ id }, query] = await Promise.all([params, searchParams]);
  if (!isUuid(id)) notFound();

  const [entry, fields, recent, verifier, names] = await Promise.all([
    getScholarshipForEdit(supabase, id),
    listFieldOptions(supabase),
    entryActivity(supabase, "scholarships", id),
    lastVerifier(supabase, "scholarships", id),
    teamNames(supabase),
  ]);
  if (entry === null) {
    return (
      <>
        <PageHeader title="Edit scholarship" description="Update this scholarship." />
        <FormAlert>We couldn’t load this scholarship. Please refresh the page.</FormAlert>
      </>
    );
  }
  if (!entry) notFound();
  const s = entry.scholarship;
  const editor = s.updated_by ? names.get(s.updated_by) : undefined;

  return (
    <>
      <ScholarshipEditor
        // A fresh form after every save, so "unsaved changes" starts from what was saved.
        key={s.updated_at}
        meta={{
          table: "scholarships",
          id: s.id,
          status: s.status,
          title: s.name,
          savedLine: savedLine(s.updated_at, editor),
          verifiedAt: s.last_verified_at,
          verifiedBy: verifier ? names.get(verifier) : undefined,
          viewHref: s.status === "published" ? `/scholarships/${s.slug}` : undefined,
          isAdmin: isAdminRole(member.role),
        }}
        initial={scholarshipToValues(s, entry.fieldIds)}
        fields={fields}
        notice={editorNotice(query)}
        recent={<RecentChanges entries={recent} actors={names} />}
      />
      <EntryConfirm
        table="scholarships"
        entry={s}
        confirm={query.confirm}
        error={query.error}
        isAdmin={isAdminRole(member.role)}
      />
    </>
  );
}
