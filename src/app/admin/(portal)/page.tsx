import type { Metadata } from "next";
import Link from "next/link";
import { Award, CircleAlert, Compass, Globe, Landmark, Lightbulb, Mail, Search } from "lucide-react";
import { AddEntryMenu } from "@/components/admin/AddEntryMenu";
import { ReviewTable } from "@/components/admin/ReviewTable";
import { ActivityItem, PageHeader, Panel, StatCard } from "@/components/admin/Workspace";
import { buttonStyles } from "@/components/ui/Button";
import { NavForm } from "@/components/ui/NavForm";
import { FormNotice } from "@/components/ui/Field";
import { actorName, describeActivity } from "@/lib/admin/activity";
import { getDashboard, type Counts } from "@/lib/admin/dashboard";
import { getSessionClient, requireActiveMember } from "@/lib/admin/session";
import { isAdminRole } from "@/lib/admin/team";
import { timeAgo } from "@/lib/format";

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

/** Admin – Dashboard (Figma 13:1209). Counts come from the database. */
export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ notice?: string | string[] }>;
}) {
  const supabase = await getSessionClient();
  // Loaded alongside the membership check; nothing renders until it passes.
  // Messages are read for everyone; row-level security returns none to researchers, who don't see the card.
  const [{ member }, { notice }, data] = await Promise.all([
    requireActiveMember(),
    searchParams,
    getDashboard(supabase, { withMessages: true }),
  ]);
  const isAdmin = isAdminRole(member.role);
  const message = typeof notice === "string" ? notices[notice] : undefined;
  const { counts } = data;

  return (
    <>
      <PageHeader title="Welcome back" description="Here’s what needs attention this week.">
        <NavForm action="/admin/search" role="search" className="lg:w-[350px]">
          <label className="flex h-[52px] items-center gap-2.5 rounded-pill border border-border-strong bg-card px-[18px] has-[input:focus-visible]:outline-3 has-[input:focus-visible]:outline-offset-2 has-[input:focus-visible]:outline-deep-rose">
            <Search className="size-5 shrink-0" strokeWidth={1.75} aria-hidden="true" />
            <span className="sr-only">Search all entries</span>
            <input
              type="search"
              name="q"
              placeholder="Search all entries"
              className="min-w-0 flex-1 bg-transparent text-body-m text-ellipsis outline-none placeholder:text-muted"
            />
          </label>
        </NavForm>
        <AddEntryMenu />
      </PageHeader>

      {message && <FormNotice>{message}</FormNotice>}

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:gap-5 xl:grid-cols-4">
        <StatCard
          icon={Landmark}
          tone="bg-tint-lavender"
          label="Universities"
          href="/admin/universities"
          value={total(counts.universities)}
          caption={caption(counts.universities)}
        />
        <StatCard
          icon={Award}
          tone="bg-tint-sage"
          label="Scholarships"
          href="/admin/scholarships"
          value={total(counts.scholarships)}
          caption={caption(counts.scholarships)}
        />
        <StatCard
          icon={Globe}
          tone="bg-blush"
          label="Resources"
          href="/admin/resources"
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
          href="/admin/fields"
          value={total(counts.fields)}
          caption={caption(counts.fields)}
        />
        <StatCard
          icon={Lightbulb}
          tone="bg-tint-lavender"
          label="Guidance articles"
          href="/admin/guidance"
          value={total(counts.guidance_articles)}
          caption={caption(counts.guidance_articles)}
        />
        {isAdmin && (
          <StatCard
            icon={Mail}
            tone="bg-tint-coral"
            label="Messages"
            href="/admin/messages"
            value={data.openMessages}
            caption="Unread contact messages"
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
                  actorId={entry.actor_id}
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
