import "server-only";
import type { ActivityLogEntry, ContentStatus } from "@/lib/database.types";
import { daysUntil, isStale } from "@/lib/format";
import type { createSessionClient } from "@/lib/supabase/server";

type SessionClient = Awaited<ReturnType<typeof createSessionClient>>;

/** The content tables, as the dashboard names them. Each has an editor at its adminPath (lib/admin/content). */
export const contentSections = {
  universities: { label: "Universities", kind: "University" },
  scholarships: { label: "Scholarships", kind: "Scholarship" },
  resources: { label: "Resources", kind: "Resource" },
  fields: { label: "Fields of study", kind: "Field of study" },
  guidance_articles: { label: "Guidance articles", kind: "Guidance article" },
} as const;

export type ContentTable = keyof typeof contentSections;

export type Counts = { published: number; draft: number } | null;

export type ReviewReason =
  { type: "deadline"; days: number } | { type: "unverified" } | { type: "stale" } | { type: "no-source" };

export type ReviewItem = {
  id: string;
  name: string;
  table: ContentTable;
  lastVerifiedAt: string | null;
  reason: ReviewReason;
};

type Row = {
  id: string;
  name: string;
  status: ContentStatus;
  last_verified_at: string | null;
  source_url: string | null;
  deadline?: string | null;
};

// A scholarship whose deadline is this close is worth re-checking.
const DEADLINE_WINDOW_DAYS = 30;

/**
 * Why an entry needs a researcher's attention, if it does: a scholarship
 * deadline coming up, never verified, verified more than six months ago, or
 * no source link.
 */
export function reviewReason(row: Row, now = new Date()): ReviewReason | null {
  if (row.deadline) {
    const days = daysUntil(row.deadline, now);
    if (days >= 0 && days <= DEADLINE_WINDOW_DAYS) return { type: "deadline", days };
  }
  if (!row.last_verified_at) return { type: "unverified" };
  if (isStale(row.last_verified_at, now)) return { type: "stale" };
  if (!row.source_url) return { type: "no-source" };
  return null;
}

const reasonOrder: Record<ReviewReason["type"], number> = {
  deadline: 0,
  unverified: 1,
  stale: 2,
  "no-source": 3,
};

function byUrgency(a: ReviewItem, b: ReviewItem) {
  const order = reasonOrder[a.reason.type] - reasonOrder[b.reason.type];
  if (order) return order;
  if (a.reason.type === "deadline" && b.reason.type === "deadline") return a.reason.days - b.reason.days;
  return (a.lastVerifiedAt ?? "").localeCompare(b.lastVerifiedAt ?? "") || a.name.localeCompare(b.name);
}

export type Dashboard = {
  counts: Record<ContentTable, Counts>;
  review: ReviewItem[];
  reviewCount: number | null;
  openMessages: number | null;
  activity: ActivityLogEntry[];
  actors: Map<string, string>;
};

/**
 * Everything on the dashboard, read as the signed-in member, so row-level
 * security decides what they see (contact messages are admins only).
 * Archived entries are left out. A query that fails shows as "–".
 */
export async function getDashboard(supabase: SessionClient, { withMessages }: { withMessages: boolean }) {
  const common = "id, status, last_verified_at, source_url";
  const [universities, scholarships, resources, fields, guidance, messages, activity, team] =
    await Promise.all([
      supabase.from("universities").select(`${common}, name`).neq("status", "archived"),
      supabase.from("scholarships").select(`${common}, name, deadline`).neq("status", "archived"),
      supabase.from("resources").select(`${common}, name:title`).neq("status", "archived"),
      supabase.from("fields").select(`${common}, name`).neq("status", "archived"),
      supabase.from("guidance_articles").select(`${common}, name:title`).neq("status", "archived"),
      withMessages
        ? supabase
            .from("contact_messages")
            .select("id", { count: "exact", head: true })
            .is("read_at", null)
            .is("archived_at", null)
        : null,
      supabase.from("activity_log").select("*").order("created_at", { ascending: false }).limit(5),
      supabase.from("team_members").select("user_id, full_name, email"),
    ]);

  const tables: [ContentTable, { data: Row[] | null; error: unknown }][] = [
    ["universities", universities as { data: Row[] | null; error: unknown }],
    ["scholarships", scholarships as { data: Row[] | null; error: unknown }],
    ["resources", resources as { data: Row[] | null; error: unknown }],
    ["fields", fields as { data: Row[] | null; error: unknown }],
    ["guidance_articles", guidance as { data: Row[] | null; error: unknown }],
  ];

  const now = new Date();
  const counts = {} as Record<ContentTable, Counts>;
  const review: ReviewItem[] = [];
  let reviewFailed = false;
  for (const [table, { data, error }] of tables) {
    if (error || !data) {
      counts[table] = null;
      reviewFailed = true;
      continue;
    }
    counts[table] = {
      published: data.filter((r) => r.status === "published").length,
      draft: data.filter((r) => r.status === "draft").length,
    };
    for (const row of data) {
      const reason = reviewReason(row, now);
      if (reason) {
        review.push({ id: row.id, name: row.name, table, lastVerifiedAt: row.last_verified_at, reason });
      }
    }
  }
  review.sort(byUrgency);

  const actors = new Map((team.data ?? []).map((m) => [m.user_id, m.full_name || m.email]));
  return {
    counts,
    review,
    reviewCount: reviewFailed ? null : review.length,
    openMessages: messages && !messages.error ? (messages.count ?? 0) : null,
    activity: activity.data ?? [],
    actors,
  } satisfies Dashboard;
}
