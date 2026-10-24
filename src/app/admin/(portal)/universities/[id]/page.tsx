import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { EntryConfirm } from "@/components/admin/EntryConfirm";
import { RecentChanges } from "@/components/admin/RecentChanges";
import { UniversityEditor } from "@/components/admin/UniversityEditor";
import { PageHeader } from "@/components/admin/Workspace";
import { FormAlert } from "@/components/ui/Field";
import { isUuid, universityToValues } from "@/lib/admin/content";
import {
  entryActivity,
  getUniversityForEdit,
  lastVerifier,
  listFieldOptions,
  teamNames,
} from "@/lib/admin/entries";
import { editorNotice } from "@/lib/admin/saveEntry";
import { getSessionClient, requireActiveMember } from "@/lib/admin/session";
import { isAdminRole } from "@/lib/admin/team";
import { savedLine } from "@/lib/format";

export const metadata: Metadata = { title: "Edit university" };

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function EditUniversityPage({ params, searchParams }: Props) {
  const supabase = await getSessionClient();
  const [{ id }, query] = await Promise.all([params, searchParams]);
  if (!isUuid(id)) notFound();

  // Loaded alongside the membership check; nothing renders until it passes.
  const [{ member }, entry, fields, recent, verifier, names] = await Promise.all([
    requireActiveMember(),
    getUniversityForEdit(supabase, id),
    listFieldOptions(supabase),
    entryActivity(supabase, "universities", id),
    lastVerifier(supabase, "universities", id),
    teamNames(supabase),
  ]);
  if (entry === null) {
    return (
      <>
        <PageHeader title="Edit university" description="Update this university’s profile." />
        <FormAlert>We couldn’t load this university. Please refresh the page.</FormAlert>
      </>
    );
  }
  if (!entry) notFound();
  const u = entry.university;
  const editor = u.updated_by ? names.get(u.updated_by) : undefined;

  return (
    <>
      <UniversityEditor
        // A fresh form after every save, so "unsaved changes" starts from what was saved.
        key={u.updated_at}
        meta={{
          table: "universities",
          id: u.id,
          status: u.status,
          title: u.name,
          savedLine: savedLine(u.updated_at, editor),
          verifiedAt: u.last_verified_at,
          verifiedBy: verifier ? names.get(verifier) : undefined,
          viewHref: u.status === "published" ? `/universities/${u.slug}` : undefined,
          isAdmin: isAdminRole(member.role),
        }}
        initial={universityToValues(u, entry.programmes)}
        fields={fields}
        notice={editorNotice(query)}
        recent={<RecentChanges entries={recent} actors={names} />}
      />
      <EntryConfirm
        table="universities"
        entry={u}
        confirm={query.confirm}
        error={query.error}
        isAdmin={isAdminRole(member.role)}
      />
    </>
  );
}
