import "server-only";
import type { ContactMessage } from "@/lib/database.types";
import type { createSessionClient } from "@/lib/supabase/server";
import { isUuid } from "./content";

type SessionClient = Awaited<ReturnType<typeof createSessionClient>>;

/**
 * The messages inbox. Contact messages hold visitors' names, email
 * addresses and what they wrote, so only admins and the owner can read them:
 * row-level security returns nothing to anyone else, and every page and
 * action here checks the role too. Read as the signed-in member.
 */

export const MESSAGES_PAGE_SIZE = 50;

export type MessageTab = "inbox" | "unread" | "archived";
export const messageTabs: { key: MessageTab; label: string }[] = [
  { key: "inbox", label: "Inbox" },
  { key: "unread", label: "Unread" },
  { key: "archived", label: "Archived" },
];

export type MessageParams = { tab: MessageTab; page: number };

const one = (value: string | string[] | undefined) => (typeof value === "string" ? value : "");

export function readMessageParams(raw: Record<string, string | string[] | undefined>): MessageParams {
  const tab = one(raw.tab);
  const page = Number.parseInt(one(raw.page), 10);
  return {
    tab: messageTabs.some((t) => t.key === tab) ? (tab as MessageTab) : "inbox",
    page: Number.isFinite(page) && page > 1 ? page : 1,
  };
}

export function messagesHref(params: Partial<MessageParams>) {
  const query = new URLSearchParams();
  if (params.tab && params.tab !== "inbox") query.set("tab", params.tab);
  if (params.page && params.page > 1) query.set("page", String(params.page));
  const s = query.toString();
  return s ? `/admin/messages?${s}` : "/admin/messages";
}

export type MessageRow = Pick<
  ContactMessage,
  "id" | "name" | "email" | "message" | "created_at" | "read_at" | "archived_at"
>;

export type MessageCounts = Record<MessageTab, number>;

/**
 * One page of the chosen tab, newest first, with the count for each tab.
 * Four reads, sent together. Null when any of them fails.
 */
export async function listMessages(supabase: SessionClient, { tab, page }: MessageParams) {
  const head = () => supabase.from("contact_messages").select("id", { count: "exact", head: true });
  let rows = supabase
    .from("contact_messages")
    .select("id, name, email, message, created_at, read_at, archived_at")
    .order("created_at", { ascending: false })
    .order("id", { ascending: false });
  if (tab === "archived") rows = rows.not("archived_at", "is", null);
  else {
    rows = rows.is("archived_at", null);
    if (tab === "unread") rows = rows.is("read_at", null);
  }
  const start = (page - 1) * MESSAGES_PAGE_SIZE;
  const [list, inbox, unread, archived] = await Promise.all([
    rows.range(start, start + MESSAGES_PAGE_SIZE - 1),
    head().is("archived_at", null),
    head().is("archived_at", null).is("read_at", null),
    head().not("archived_at", "is", null),
  ]);
  // A page past the end is a 416 from PostgREST, not a failure.
  if ((list.error && list.error.code !== "PGRST103") || inbox.error || unread.error || archived.error)
    return null;
  const counts: MessageCounts = {
    inbox: inbox.count ?? 0,
    unread: unread.count ?? 0,
    archived: archived.count ?? 0,
  };
  return { rows: (list.data ?? []) as MessageRow[], counts };
}

/** One message, or undefined if there is no such message (or it isn't visible to this person). */
export async function getMessage(supabase: SessionClient, id: string) {
  if (!isUuid(id)) return undefined;
  const { data, error } = await supabase
    .from("contact_messages")
    .select("id, name, email, message, created_at, read_at, read_by, archived_at, archived_by")
    .eq("id", id)
    .maybeSingle();
  if (error) return null;
  return data ?? undefined;
}
