import type { Metadata } from "next";
import { ReviewTable } from "@/components/admin/ReviewTable";
import { PageHeader, Panel } from "@/components/admin/Workspace";
import { getDashboard } from "@/lib/admin/dashboard";
import { getSessionClient, requireActiveMember } from "@/lib/admin/session";

export const metadata: Metadata = { title: "Needs review" };

/** Every entry in the dashboard's "Needs review", most urgent first. */
export default async function ReviewPage() {
  const supabase = await getSessionClient();
  // Loaded alongside the membership check; nothing renders until it passes.
  const [, { review, reviewCount }] = await Promise.all([
    requireActiveMember(),
    getDashboard(supabase, { withMessages: false }),
  ]);
  return (
    <>
      <PageHeader
        title="Needs review"
        description="Every entry with a deadline coming up, never verified, verified more than six months ago or missing a source."
      />
      <Panel
        title={reviewCount === null ? "Entries" : `${reviewCount} ${reviewCount === 1 ? "entry" : "entries"}`}
      >
        <ReviewTable items={review} failed={reviewCount === null} />
      </Panel>
    </>
  );
}
