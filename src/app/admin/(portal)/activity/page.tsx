import type { Metadata } from "next";
import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { ActivityItem, PageHeader, Pager } from "@/components/admin/Workspace";
import { buttonStyles } from "@/components/ui/Button";
import { OptionChip } from "@/components/ui/Chip";
import { FormAlert, fieldClass } from "@/components/ui/Field";
import { actorName, describeActivity } from "@/lib/admin/activity";
import {
  ACTIVITY_PAGE_SIZE,
  actionFilters,
  activityHref,
  entityFilters,
  existingEntries,
  getActivityPage,
  readActivityFilters,
  type ActivityFilters,
} from "@/lib/admin/activityLog";
import { entryTypes, isEntryTable } from "@/lib/admin/content";
import { teamNames } from "@/lib/admin/entries";
import { requireActiveMember } from "@/lib/admin/session";
import type { ActivityLogEntry } from "@/lib/database.types";
import { formatLongDate } from "@/lib/format";

export const metadata: Metadata = { title: "Activity log" };

const dayKey = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Karachi" });
const weekday = new Intl.DateTimeFormat("en-GB", { weekday: "long", timeZone: "Asia/Karachi" });
const clock = new Intl.DateTimeFormat("en-GB", {
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Asia/Karachi",
});

/** "Today", "Yesterday" or "Monday, 20 Oct 2026", in Pakistan time. */
function dayHeading(iso: string, now: Date) {
  const day = dayKey.format(new Date(iso));
  if (day === dayKey.format(now)) return "Today";
  if (day === dayKey.format(new Date(now.getTime() - 86_400_000))) return "Yesterday";
  return `${weekday.format(new Date(iso))}, ${formatLongDate(iso)}`;
}

/** Consecutive entries grouped under their day. */
function byDay(entries: ActivityLogEntry[], now: Date) {
  const groups: { heading: string; entries: ActivityLogEntry[] }[] = [];
  for (const entry of entries) {
    const heading = dayHeading(entry.created_at, now);
    const last = groups.at(-1);
    if (last?.heading === heading) last.entries.push(entry);
    else groups.push({ heading, entries: [entry] });
  }
  return groups;
}

/**
 * Admin – Activity log (Figma 36:4479): every change, newest first, 50 to a
 * page. Filter by kind of entry, person, action and dates; all of it lives
 * in the address, so Back and shared links keep the view.
 */
export default async function ActivityPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { supabase } = await requireActiveMember();
  const filters = readActivityFilters(await searchParams);
  const [result, names] = await Promise.all([getActivityPage(supabase, filters), teamNames(supabase)]);
  const existing = result ? await existingEntries(supabase, result.entries) : new Set<string>();
  const filtered = !!(filters.type || filters.person || filters.action || filters.from || filters.to);
  const now = new Date();

  const people = [...names.entries()].sort((a, b) => a[1].localeCompare(b[1]));

  return (
    <>
      <PageHeader
        title="Activity log"
        description="Every change, who made it and when. Useful when a fee or date looks wrong."
      />

      <nav aria-label="Filter by kind of entry" className="flex flex-wrap gap-2">
        <OptionChip href={activityHref({ ...filters, type: "", page: 1 })} selected={!filters.type}>
          All
        </OptionChip>
        {entityFilters.map((f) => (
          <OptionChip
            key={f.value}
            href={activityHref({ ...filters, type: f.value, page: 1 })}
            selected={filters.type === f.value}
          >
            {f.label}
          </OptionChip>
        ))}
      </nav>

      <ActivityFilterForm filters={filters} people={people} filtered={filtered} />

      {!result ? (
        <FormAlert>We couldn’t load the activity log. Please refresh the page.</FormAlert>
      ) : (
        <section
          aria-label="Changes"
          className="overflow-hidden rounded-[20px] border border-border-soft bg-card"
        >
          {result.entries.length ? (
            <div className="flex flex-col gap-5 p-5 lg:p-6">
              {byDay(result.entries, now).map((group) => (
                <div key={group.heading} className="flex flex-col gap-3">
                  <h2 className="text-label-s text-muted">{group.heading}</h2>
                  <ul className="flex flex-col gap-[18px]">
                    {group.entries.map((entry) => (
                      <ActivityItem
                        key={entry.id}
                        actor={actorName(entry.actor_id, names)}
                        actorId={entry.actor_id}
                        text={describeActivity(entry, names)}
                        when={clock.format(new Date(entry.created_at))}
                        extra={<EntryLink entry={entry} exists={existing} />}
                      />
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          ) : (
            <p className="p-5 text-body-s text-muted lg:p-6">
              {filtered ? "No changes match these filters." : "Nothing yet."}
            </p>
          )}
          {result.total > 0 && (
            <Pager
              page={filters.page}
              pageSize={ACTIVITY_PAGE_SIZE}
              total={result.total}
              noun="the activity log"
              hrefFor={(page) => activityHref({ ...filters, page })}
            />
          )}
        </section>
      )}
    </>
  );
}

/** " · Open university" for entries with an editor, " · Deleted" once they're gone. */
function EntryLink({ entry, exists }: { entry: ActivityLogEntry; exists: Set<string> }) {
  if (!isEntryTable(entry.entity_type) || !entry.entity_id) return null;
  const type = entryTypes[entry.entity_type];
  if (!exists.has(entry.entity_id)) return <> · Deleted</>;
  return (
    <>
      {" · "}
      <Link
        href={`${type.adminPath}/${entry.entity_id}`}
        className="text-deep-rose underline underline-offset-2 hover:text-charcoal"
      >
        Open {type.one}
        {entry.summary && <span className="sr-only">: {entry.summary}</span>}
      </Link>
    </>
  );
}

const selectClass = `${fieldClass} h-12 cursor-pointer appearance-none pr-11`;

function Select({
  id,
  label,
  value,
  options,
}: {
  id: string;
  label: string;
  value: string;
  options: { value: string; label: string }[];
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-label-m">
        {label}
      </label>
      <div className="relative">
        <select id={id} name={id} defaultValue={value} className={selectClass}>
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <ChevronDown
          className="pointer-events-none absolute top-1/2 right-3.5 size-5 -translate-y-1/2"
          strokeWidth={1.75}
          aria-hidden="true"
        />
      </div>
    </div>
  );
}

/** Person, action and dates: a plain GET form, so it works without JavaScript. */
function ActivityFilterForm({
  filters,
  people,
  filtered,
}: {
  filters: ActivityFilters;
  people: [string, string][];
  filtered: boolean;
}) {
  return (
    <form
      action="/admin/activity"
      aria-label="Filter the activity log"
      className="grid gap-4 rounded-[20px] border border-border-soft bg-card p-5 sm:grid-cols-2 lg:p-6 xl:grid-cols-[repeat(4,minmax(0,1fr))_auto] xl:items-end"
    >
      {filters.type && <input type="hidden" name="type" value={filters.type} />}
      <Select
        id="person"
        label="Person"
        value={filters.person}
        options={[
          { value: "", label: "Everyone" },
          ...people.map(([id, name]) => ({ value: id, label: name })),
          { value: "system", label: "The system" },
        ]}
      />
      <Select
        id="action"
        label="Action"
        value={filters.action}
        options={[{ value: "", label: "Any action" }, ...actionFilters]}
      />
      <div className="flex flex-col gap-1.5">
        <label htmlFor="from" className="text-label-m">
          From
        </label>
        <input
          id="from"
          name="from"
          type="date"
          defaultValue={filters.from}
          className={`${fieldClass} h-12`}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="to" className="text-label-m">
          To
        </label>
        <input id="to" name="to" type="date" defaultValue={filters.to} className={`${fieldClass} h-12`} />
      </div>
      <div className="flex items-center gap-4 sm:col-span-2 xl:col-span-1">
        <button type="submit" className={`${buttonStyles.small} cursor-pointer px-5 py-3`}>
          Apply
        </button>
        {filtered && (
          <Link href="/admin/activity" className={buttonStyles.text}>
            Clear filters
          </Link>
        )}
      </div>
    </form>
  );
}
