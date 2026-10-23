import type { Metadata } from "next";
import { UniversityEditor } from "@/components/admin/UniversityEditor";
import { emptyUniversity } from "@/lib/admin/content";
import { listFieldOptions } from "@/lib/admin/entries";
import { requireActiveMember } from "@/lib/admin/session";

export const metadata: Metadata = { title: "New university" };

export default async function NewUniversityPage() {
  const { supabase } = await requireActiveMember();
  const fields = await listFieldOptions(supabase);
  return (
    <UniversityEditor
      meta={{ table: "universities", id: null, status: null, title: "New university", verifiedAt: null }}
      initial={emptyUniversity}
      fields={fields}
    />
  );
}
