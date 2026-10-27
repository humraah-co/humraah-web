import type { Metadata } from "next";
import { ResourceEditor } from "@/components/admin/ResourceEditor";
import { requireActiveMember } from "@/lib/admin/session";
import { emptyResource } from "@/lib/admin/siteContent";

export const metadata: Metadata = { title: "New resource" };

export default async function NewResourcesPage() {
  await requireActiveMember();
  return (
    <ResourceEditor
      meta={{
        table: "resources",
        id: null,
        status: null,
        title: "New resource",
        verifiedAt: null,
        isAdmin: false,
      }}
      initial={emptyResource}
    />
  );
}
