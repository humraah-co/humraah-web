import type { Metadata } from "next";
import { ScholarshipEditor } from "@/components/admin/ScholarshipEditor";
import { emptyScholarship } from "@/lib/admin/content";
import { listFieldOptions } from "@/lib/admin/entries";
import { requireActiveMember } from "@/lib/admin/session";

export const metadata: Metadata = { title: "New scholarship" };

export default async function NewScholarshipPage() {
  const { supabase } = await requireActiveMember();
  const fields = await listFieldOptions(supabase);
  return (
    <ScholarshipEditor
      meta={{
        table: "scholarships",
        id: null,
        status: null,
        title: "New scholarship",
        verifiedAt: null,
        isAdmin: false,
      }}
      initial={emptyScholarship}
      fields={fields}
    />
  );
}
