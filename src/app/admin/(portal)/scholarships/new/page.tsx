import type { Metadata } from "next";
import { ScholarshipEditor } from "@/components/admin/ScholarshipEditor";
import { emptyScholarship } from "@/lib/admin/content";
import { listFieldOptions } from "@/lib/admin/entries";
import { getSessionClient, requireActiveMember } from "@/lib/admin/session";

export const metadata: Metadata = { title: "New scholarship" };

export default async function NewScholarshipPage() {
  const supabase = await getSessionClient();
  // Loaded alongside the membership check; nothing renders until it passes.
  const [, fields] = await Promise.all([requireActiveMember(), listFieldOptions(supabase)]);
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
