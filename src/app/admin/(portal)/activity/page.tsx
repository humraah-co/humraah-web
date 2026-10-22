import type { Metadata } from "next";
import { ActivityItem, PageHeader } from "@/components/admin/Workspace";
import { FormAlert } from "@/components/ui/Field";
import { actorName, describeActivity } from "@/lib/admin/activity";
import { getRecentActivity } from "@/lib/admin/dashboard";
import { requireActiveMember } from "@/lib/admin/session";
import { formatLongDate, timeAgo } from "@/lib/format";

export const metadata: Metadata = { title: "Activity log" };

/** A simple list for now: the full log, with filters, comes on Day 5. */
export default async function ActivityPage() {
  const { supabase } = await requireActiveMember();
  const { activity, actors } = await getRecentActivity(supabase, 50);
  return (
    <>
      <PageHeader
        title="Activity log"
        description="Every change to content and the team, newest first. Filters and the full history come on Day 5."
      />
      {!activity ? (
        <FormAlert>We couldn’t load the activity log. Please refresh the page.</FormAlert>
      ) : (
        <section className="max-w-[760px] rounded-[20px] border border-border-soft bg-card p-5 lg:p-6">
          <h2 className="sr-only">Latest 50 changes</h2>
          {activity.length ? (
            <ul className="flex flex-col gap-[18px]">
              {activity.map((entry) => (
                <ActivityItem
                  key={entry.id}
                  actor={actorName(entry.actor_id, actors)}
                  actorKey={entry.actor_id ?? "system"}
                  text={describeActivity(entry, actors)}
                  when={`${timeAgo(entry.created_at)} · ${formatLongDate(entry.created_at)}`}
                />
              ))}
            </ul>
          ) : (
            <p className="text-body-s text-muted">Nothing yet.</p>
          )}
        </section>
      )}
    </>
  );
}
