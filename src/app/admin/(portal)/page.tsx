import type { Metadata } from "next";
import Link from "next/link";
import { Award, CircleAlert, Compass, Globe, Landmark, Lightbulb, Mail, Plus, Search } from "lucide-react";
import { ActivityItem, PageHeader, Panel, StatCard } from "@/components/admin/Workspace";
import { ButtonLink, buttonStyles } from "@/components/ui/Button";
import { Chip, DeadlineChip } from "@/components/ui/Chip";
import { FormNotice } from "@/components/ui/Field";
import { actorName, describeActivity } from "@/lib/admin/activity";
import { contentSections, getDashboard, type Counts, type ReviewItem } from "@/lib/admin/dashboard";
import { requireActiveMember } from "@/lib/admin/session";
import { isAdminRole } from "@/lib/admin/team";
import { formatLongDate, timeAgo } from "@/lib/format";

export const metadata: Metadata = { title: "Dashboard" };

const notices: Record<string, string> = {
  welcome: "Welcome to the team. Your account is ready.",
  "password-updated": "Your password has been changed.",
};

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;

function caption(counts: Counts) {
  if (!counts) return "Couldn’t load the numbers";
  return `${counts.published} published, ${plural(counts.draft, "draft")}`;
}
const total = (counts: Counts) => (counts ? counts.published + counts.draft : null);

/** Admin – Dashboard (Figma 13:1209). Counts come from the database; editing arrives on Day 5. */
export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ notice?: string | string[] }>;
}) {
  const { supabase, member } = await requireActiveMember();
  const isAdmin = isAdminRole(member.role);
  const [{ notice }, data] = await Promise.all([
    searchParams,
    getDashboard(supabase, { withMessages: isAdmin }),
  ]);
  const message = typeof notice === "string" ? notices[notice] : undefined;
  const { counts } = data;

  return (
    <>
      <PageHeader title="Welcome back" description="Here’s what needs attention this week.">
        <form action="/admin/search" role="search" className="lg:w-[350px]">
          <label className="flex h-[52px] items-center gap-2.5 rounded-pill border border-border-strong bg-card px-[18px]">
            <Search className="size-5 shrink-0" strokeWidth={1.75} aria-hidden="true" />
            <span className="sr-only">Search universities and scholarships</span>
            <input
              type="search"
              name="q"
              placeholder="Search universities and scholarships"
              className="min-w-0 flex-1 bg-transparent text-body-m text-ellipsis outline-none placeholder:text-muted"
            />
          </label>
        </form>
        <ButtonLink href="/admin/new">
          <Plus className="size-5" strokeWidth={1.75} aria-hidden="true" />
          Add an entry
        </ButtonLink>
      </PageHeader>

      {message && <FormNotice>{message}</FormNotice>}

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:gap-5 xl:grid-cols-4">
        <StatCard
          icon={Landmark}
          tone="bg-tint-lavender"
          label="Universities"
          value={total(counts.universities)}
          caption={caption(counts.universities)}
        />
        <StatCard
          icon={Award}
          tone="bg-tint-sage"
          label="Scholarships"
          value={total(counts.scholarships)}
          caption={caption(counts.scholarships)}
        />
        <StatCard
          icon={Globe}
          tone="bg-blush"
          label="Resources"
          value={total(counts.resources)}
          caption={caption(counts.resources)}
        />
        <StatCard
          icon={CircleAlert}
          tone="bg-tint-coral"
          label="Needs review"
          value={data.reviewCount}
          caption="Unverified, out of date or missing a source"
        />
        <StatCard
          icon={Compass}
          tone="bg-tint-sage"
          label="Fields of study"
          value={total(counts.fields)}
          caption={caption(counts.fields)}
        />
        <StatCard
          icon={Lightbulb}
          tone="bg-tint-lavender"
          label="Guidance articles"
          value={total(counts.guidance_articles)}
          caption={caption(counts.guidance_articles)}
        />
        {isAdmin && (
          <StatCard
            icon={Mail}
            tone="bg-tint-coral"
            label="Contact messages"
            value={data.openMessages}
            caption="Waiting for a reply"
          />
        )}
      </div>

      <div className="flex flex-col gap-6 xl:flex-row xl:items-start">
        <Panel
          title="Needs review"
          className="min-w-0 flex-1"
          action={
            <Link href="/admin/review" className={buttonStyles.text}>
              View all
            </Link>
          }
        >
          <ReviewTable items={data.review.slice(0, 5)} failed={data.reviewCount === null} />
        </Panel>

        <section className="flex flex-col gap-[18px] rounded-[20px] border border-border-soft bg-card p-5 lg:p-6 xl:w-[340px] xl:shrink-0">
          <h2 className="text-h3">Recent activity</h2>
          {data.activity.length ? (
            <ul className="flex flex-col gap-[18px]">
              {data.activity.map((entry) => (
                <ActivityItem
                  key={entry.id}
                  actor={actorName(entry.actor_id, data.actors)}
                  actorKey={entry.actor_id ?? "system"}
                  text={describeActivity(entry, data.actors)}
                  when={timeAgo(entry.created_at)}
                />
              ))}
            </ul>
          ) : (
            <p className="text-body-s text-muted">
              Nothing yet. Changes to content and the team will show here.
            </p>
          )}
          <Link href="/admin/activity" className={`${buttonStyles.text} self-start`}>
            Open activity log
          </Link>
        </section>
      </div>
    </>
  );
}

function ReasonChip({ reason }: { reason: ReviewItem["reason"] }) {
  switch (reason.type) {
    case "deadline":
      return (
        <DeadlineChip urgent>
          {reason.days === 0 ? "Deadline today" : `Deadline in ${plural(reason.days, "day")}`}
        </DeadlineChip>
      );
    case "unverified":
      return <Chip tone="lavender">Not yet verified</Chip>;
    case "stale":
      return <Chip tone="coral">Not verified in 6+ months</Chip>;
    case "no-source":
      return <Chip tone="coral">Missing source link</Chip>;
  }
}

/** The Needs review table; on a phone each row stacks. */
function ReviewTable({ items, failed }: { items: ReviewItem[]; failed: boolean }) {
  if (failed) {
    return (
      <p className="border-t border-border-soft px-5 py-4 text-body-s text-muted lg:px-6">
        Couldn’t load entries.
      </p>
    );
  }
  if (!items.length) {
    return (
      <p className="border-t border-border-soft px-5 py-4 text-body-s text-muted lg:px-6">
        Nothing needs review right now. Every entry is verified, recent and has a source.
      </p>
    );
  }
  return (
    <table className="w-full text-left">
      <thead className="hidden bg-cream md:table-header-group">
        <tr className="text-label-s text-muted">
          <th scope="col" className="px-6 py-2.5 font-semibold">
            Entry
          </th>
          <th scope="col" className="w-[120px] py-2.5 font-semibold">
            Last verified
          </th>
          <th scope="col" className="w-[206px] py-2.5 pl-4 font-semibold">
            Why it needs review
          </th>
          <th scope="col" className="w-[88px] py-2.5 pr-6">
            <span className="sr-only">Action</span>
          </th>
        </tr>
      </thead>
      <tbody>
        {items.map((item) => {
          const section = contentSections[item.table];
          return (
            <tr
              key={`${item.table}-${item.id}`}
              className="flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-border-soft px-5 py-3.5 md:table-row md:px-0"
            >
              <td className="w-full md:w-auto md:py-3.5 md:pl-6">
                <p className="text-label-m">{item.name}</p>
                <p className="text-caption text-muted">{section.kind}</p>
              </td>
              <td className="w-full text-body-s md:w-auto md:py-3.5">
                <span className="md:hidden">Last verified: </span>
                {item.lastVerifiedAt ? formatLongDate(item.lastVerifiedAt) : "Never"}
              </td>
              <td className="md:py-3.5 md:pl-4">
                <ReasonChip reason={item.reason} />
              </td>
              <td className="ml-auto md:py-3.5 md:pr-6 md:text-right">
                <Link href={`/admin/${section.section}`} className={buttonStyles.text}>
                  Review<span className="sr-only"> {item.name}</span>
                </Link>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
