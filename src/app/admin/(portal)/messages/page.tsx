import type { Metadata } from "next";
import Link from "next/link";
import { Lock } from "lucide-react";
import { PageHeader, Pager } from "@/components/admin/Workspace";
import { Chip, OptionChip } from "@/components/ui/Chip";
import { FormAlert } from "@/components/ui/Field";
import {
  MESSAGES_PAGE_SIZE,
  listMessages,
  messageTabs,
  messagesHref,
  readMessageParams,
  type MessageRow,
} from "@/lib/admin/messages";
import { getSessionClient, requireActiveMember } from "@/lib/admin/session";
import { isAdminRole } from "@/lib/admin/team";
import { timeAgo } from "@/lib/format";

export const metadata: Metadata = { title: "Messages" };

type Search = Record<string, string | string[] | undefined>;

const PREVIEW = 160;
const preview = (text: string) => {
  const flat = text.replace(/\s+/g, " ").trim();
  return flat.length > PREVIEW ? `${flat.slice(0, PREVIEW).trimEnd()}…` : flat;
};

/** Admin – Messages: what visitors sent through the contact form, newest first. */
export default async function MessagesPage({ searchParams }: { searchParams: Promise<Search> }) {
  const supabase = await getSessionClient();
  const raw = await searchParams;
  const params = readMessageParams(raw);
  // Loaded alongside the membership check; nothing renders until it passes.
  // Row-level security returns nothing to anyone but admins; the role is checked below as well.
  const [{ member }, result] = await Promise.all([requireActiveMember(), listMessages(supabase, params)]);

  if (!isAdminRole(member.role)) {
    return (
      <>
        <PageHeader title="Messages" description="What visitors send through the contact form." />
        <p className="flex max-w-[640px] items-start gap-3 rounded-[20px] border border-border-soft bg-card p-5 text-body-m">
          <Lock className="mt-0.5 size-5 shrink-0 text-deep-rose" strokeWidth={1.75} aria-hidden="true" />
          Only admins and the owner can read contact messages, because they contain visitors’ personal
          details.
        </p>
      </>
    );
  }

  const shown = result?.counts[params.tab] ?? 0;
  const pages = Math.max(1, Math.ceil(shown / MESSAGES_PAGE_SIZE));
  const page = Math.min(params.page, pages);

  return (
    <>
      <PageHeader
        title="Messages"
        description="What visitors send through the contact form. Open one to read it, mark it read or archive it."
      />

      <nav aria-label="Filter messages" className="flex flex-wrap gap-2">
        {messageTabs.map((tab) => (
          <OptionChip key={tab.key} href={messagesHref({ tab: tab.key })} selected={params.tab === tab.key}>
            {tab.label}
            <span className="text-muted">{result?.counts[tab.key] ?? "–"}</span>
          </OptionChip>
        ))}
      </nav>

      {result === null ? (
        <FormAlert>We couldn’t load the messages. Please refresh the page.</FormAlert>
      ) : (
        <div className="overflow-hidden rounded-[20px] border border-border-soft bg-card">
          {result.rows.length ? (
            <ul>
              {result.rows.map((row) => (
                <MessageItem key={row.id} row={row} />
              ))}
            </ul>
          ) : (
            <p className="px-5 py-6 text-body-s text-muted lg:px-6">
              {params.tab === "unread"
                ? "No unread messages. Everything has been read."
                : params.tab === "archived"
                  ? "Nothing is archived."
                  : "No messages yet. They appear here when someone uses the contact form."}
            </p>
          )}
          {shown > 0 && (
            <Pager
              page={page}
              pageSize={MESSAGES_PAGE_SIZE}
              total={shown}
              noun="messages"
              hrefFor={(p) => messagesHref({ tab: params.tab, page: p })}
            />
          )}
        </div>
      )}
    </>
  );
}

function MessageItem({ row }: { row: MessageRow }) {
  const unread = !row.read_at;
  return (
    <li className="border-t border-border-soft first:border-t-0">
      <Link
        href={`/admin/messages/${row.id}`}
        className="flex flex-col gap-1 px-5 py-4 hover:bg-cream lg:px-6"
      >
        <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <span className={`min-w-0 break-words ${unread ? "text-label-m" : "text-body-m"}`}>
            {row.name}
            <span className="sr-only">, {unread ? "unread" : "read"}</span>
          </span>
          {unread && <Chip tone="coral">Unread</Chip>}
          {row.archived_at && <Chip tone="outline">Archived</Chip>}
          <span className="ml-auto text-caption text-muted">{timeAgo(row.created_at)}</span>
        </span>
        <span className="text-caption break-all text-muted">{row.email}</span>
        <span className={`line-clamp-2 text-body-s break-words ${unread ? "" : "text-muted"}`}>
          {preview(row.message)}
        </span>
      </Link>
    </li>
  );
}
