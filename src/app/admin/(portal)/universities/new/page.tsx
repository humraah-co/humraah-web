import type { Metadata } from "next";
import { UniversityEditor } from "@/components/admin/UniversityEditor";
import { emptyUniversity } from "@/lib/admin/content";
import { listFieldOptions } from "@/lib/admin/entries";
import { getSessionClient, requireActiveMember } from "@/lib/admin/session";

export const metadata: Metadata = { title: "New university" };

export default async function NewUniversityPage() {
  const supabase = await getSessionClient();
  // Loaded alongside the membership check; nothing renders until it passes.
  const [, fields] = await Promise.all([requireActiveMember(), listFieldOptions(supabase)]);
  return (
    <UniversityEditor
      meta={{
        table: "universities",
        id: null,
        status: null,
        title: "New university",
        verifiedAt: null,
        isAdmin: false,
      }}
      initial={emptyUniversity}
      fields={fields}
    />
  );
}
