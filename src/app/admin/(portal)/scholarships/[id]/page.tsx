import type { Metadata } from "next";
import { notFound } from "next/navigation";
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
import { saveNotice } from "@/lib/admin/saveEntry";
import { requireActiveMember } from "@/lib/admin/session";
import { savedLine } from "@/lib/format";

export const metadata: Metadata = { title: "Edit scholarship" };

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function EditScholarshipPage({ params, searchParams }: Props) {
  const { supabase } = await requireActiveMember();
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
      }}
      initial={scholarshipToValues(s, entry.fieldIds)}
      fields={fields}
      notice={saveNotice(query.notice)}
      recent={<RecentChanges entries={recent} actors={names} />}
    />
  );
}
