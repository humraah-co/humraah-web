import { GuidePdfs } from "@/components/admin/GuidePdfs";
import { PageHeader } from "@/components/admin/Workspace";
import { FormAlert } from "@/components/ui/Field";
import { isAdminRole } from "@/lib/admin/team";
import { getSupabaseEnv } from "@/lib/supabase/env";
import type { GuideFile, TeamRole } from "@/lib/database.types";

/** The "Guide PDFs" tab of Guidance and resources (the switch between tabs is passed in). */
export function GuidancePdfsTab({
  files,
  names,
  role,
  switcher,
}: {
  /** Null when the list couldn’t be loaded. */
  files: GuideFile[] | null;
  names: Map<string, string>;
  role: TeamRole;
  switcher: React.ReactNode;
}) {
  return (
    <>
      <PageHeader
        title="Guidance and resources"
        description="The two Higher Education Guide PDFs that visitors download from the Guidance page. Anyone on the team can upload or replace one."
      />
      {switcher}
      {files ? (
        <GuidePdfs
          files={files}
          names={names}
          supabaseUrl={getSupabaseEnv()?.url ?? null}
          canRemove={isAdminRole(role)}
        />
      ) : (
        <FormAlert>We couldn’t load the guide PDFs just now. Please refresh the page.</FormAlert>
      )}
    </>
  );
}
