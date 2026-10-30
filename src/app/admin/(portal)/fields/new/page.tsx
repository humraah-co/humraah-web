import type { Metadata } from "next";
import { FieldEditor } from "@/components/admin/FieldEditor";
import { requireActiveMember } from "@/lib/admin/session";
import { emptyField } from "@/lib/admin/siteContent";

export const metadata: Metadata = { title: "New field of study" };

export default async function NewFieldsOfStudyPage() {
  await requireActiveMember();
  return (
    <FieldEditor
      meta={{
        table: "fields",
        id: null,
        status: null,
        title: "New field of study",
        verifiedAt: null,
        isAdmin: false,
      }}
      initial={emptyField}
    />
  );
}
