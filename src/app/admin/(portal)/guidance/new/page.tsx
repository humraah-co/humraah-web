import type { Metadata } from "next";
import { GuidanceEditor } from "@/components/admin/GuidanceEditor";
import { requireActiveMember } from "@/lib/admin/session";
import { emptyGuidance } from "@/lib/admin/siteContent";

export const metadata: Metadata = { title: "New guidance article" };

export default async function NewGuidanceArticlesPage() {
  await requireActiveMember();
  return (
    <GuidanceEditor
      meta={{
        table: "guidance_articles",
        id: null,
        status: null,
        title: "New guidance article",
        verifiedAt: null,
        isAdmin: false,
      }}
      initial={emptyGuidance}
    />
  );
}
