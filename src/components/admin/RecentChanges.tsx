import { ActivityItem } from "@/components/admin/Workspace";
import { actorName, describeActivity } from "@/lib/admin/activity";
import type { ActivityLogEntry } from "@/lib/database.types";
import { timeAgo } from "@/lib/format";

/** The editor's "Recent changes" card (Figma 36:3943): the latest log entries for this entry. */
export function RecentChanges({
  entries,
  actors,
}: {
  entries: ActivityLogEntry[];
  actors: Map<string, string>;
}) {
  return (
    <section
      aria-labelledby="recent-changes-title"
      className="flex flex-col gap-[18px] rounded-[20px] border border-border-soft bg-card p-5 lg:p-6"
    >
      <h2 id="recent-changes-title" className="text-h3">
        Recent changes
      </h2>
      {entries.length ? (
        <ul className="flex flex-col gap-[18px]">
          {entries.map((entry) => (
            <ActivityItem
              key={entry.id}
              actor={actorName(entry.actor_id, actors)}
              actorId={entry.actor_id}
              text={describeActivity(entry, actors)}
              when={timeAgo(entry.created_at)}
            />
          ))}
        </ul>
      ) : (
        <p className="text-body-s text-muted">No changes yet.</p>
      )}
    </section>
  );
}
