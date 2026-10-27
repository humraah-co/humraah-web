import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Archive, ArchiveRestore, ChevronRight, Lock, Mail, MailOpen } from "lucide-react";
import {
  archiveMessage,
  markMessageRead,
  markMessageUnread,
  unarchiveMessage,
} from "@/app/admin/(portal)/messages/actions";
import { PageHeader } from "@/components/admin/Workspace";
import { buttonStyles } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { FormAlert, FormNotice } from "@/components/ui/Field";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { isUuid } from "@/lib/admin/content";
import { teamNames } from "@/lib/admin/entries";
import { getMessage } from "@/lib/admin/messages";
import { getSessionClient, requireActiveMember } from "@/lib/admin/session";
import { isAdminRole } from "@/lib/admin/team";
import { formatLongDate } from "@/lib/format";

export const metadata: Metadata = { title: "Message" };

const notices: Record<string, string> = {
  read: "Marked as read.",
  unread: "Marked as unread.",
  archived: "Archived. You can find it under Archived.",
  unarchived: "Taken out of the archive.",
};

const when = (iso: string) =>
  `${formatLongDate(iso)}, ${new Date(iso).toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Karachi",
  })}`;

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

/** One contact message, with read and archive buttons. It is not marked read just by opening it. */
export default async function MessagePage({ params, searchParams }: Props) {
  const supabase = await getSessionClient();
  const [{ id }, query] = await Promise.all([params, searchParams]);
  if (!isUuid(id)) notFound();

  // Loaded alongside the membership check; nothing renders until it passes.
  const [{ member }, message, names] = await Promise.all([
    requireActiveMember(),
    getMessage(supabase, id),
    teamNames(supabase),
  ]);

  if (!isAdminRole(member.role)) {
    return (
      <>
        <PageHeader title="Message" description="Contact messages are private." />
        <p className="flex max-w-[640px] items-start gap-3 rounded-[20px] border border-border-soft bg-card p-5 text-body-m">
          <Lock className="mt-0.5 size-5 shrink-0 text-deep-rose" strokeWidth={1.75} aria-hidden="true" />
          Only admins and the owner can read contact messages, because they contain visitors’ personal
          details.
        </p>
      </>
    );
  }
  if (message === null) {
    return (
      <>
        <PageHeader title="Message" description="What a visitor sent through the contact form." />
        <FormAlert>We couldn’t load this message. Please refresh the page.</FormAlert>
      </>
    );
  }
  if (!message) notFound();

  const m = message;
  const unread = !m.read_at;
  const archived = !!m.archived_at;
  const notice = typeof query.notice === "string" ? notices[query.notice] : undefined;
  const failed = query.error === "failed";
  const hidden = <input type="hidden" name="id" value={m.id} />;
  const listHref = archived ? "/admin/messages?tab=archived" : "/admin/messages";

  return (
    <>
      <header className="flex flex-col gap-2">
        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-body-s">
          <Link href={listHref} className={buttonStyles.text}>
            Messages
          </Link>
          <ChevronRight className="size-4" strokeWidth={1.75} aria-hidden="true" />
          <span aria-current="page" className="text-muted">
            Message
          </span>
        </nav>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <h1 className="text-h1 break-words lg:tracking-[-0.2px]">{m.name}</h1>
          {unread ? <Chip tone="coral">Unread</Chip> : <Chip tone="sage">Read</Chip>}
          {archived && <Chip tone="outline">Archived</Chip>}
        </div>
      </header>

      {notice && <FormNotice>{notice}</FormNotice>}
      {failed && <FormAlert>Something went wrong. Please refresh the page and try again.</FormAlert>}

      <article className="flex max-w-[760px] flex-col gap-5 rounded-[20px] border border-border-soft bg-card p-5 lg:p-6">
        <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-[auto_minmax(0,1fr)]">
          <dt className="text-label-m text-muted">From</dt>
          <dd className="text-body-m break-words">{m.name}</dd>
          <dt className="text-label-m text-muted">Email</dt>
          <dd className="text-body-m break-all select-all">{m.email}</dd>
          <dt className="text-label-m text-muted">Received</dt>
          <dd className="text-body-m">{when(m.created_at)}</dd>
          {m.read_at && (
            <>
              <dt className="text-label-m text-muted">Read</dt>
              <dd className="text-body-m">
                {when(m.read_at)}
                {m.read_by && names.get(m.read_by) ? ` by ${names.get(m.read_by)}` : ""}
              </dd>
            </>
          )}
          {m.archived_at && (
            <>
              <dt className="text-label-m text-muted">Archived</dt>
              <dd className="text-body-m">
                {when(m.archived_at)}
                {m.archived_by && names.get(m.archived_by) ? ` by ${names.get(m.archived_by)}` : ""}
              </dd>
            </>
          )}
        </dl>

        <div className="flex flex-col gap-2 border-t border-border-soft pt-5">
          <h2 className="text-label-m text-muted">Message</h2>
          {/* Shown exactly as written: React escapes it, and line breaks are kept. */}
          <p className="text-body-m break-words whitespace-pre-wrap">{m.message}</p>
        </div>

        <div className="flex flex-col gap-2.5 border-t border-border-soft pt-5 sm:flex-row sm:flex-wrap">
          {unread ? (
            <form action={markMessageRead}>
              {hidden}
              <SubmitButton pendingLabel="Marking…" className={`${buttonStyles.primary} w-full sm:w-auto`}>
                <MailOpen className="size-5" strokeWidth={1.75} aria-hidden="true" />
                Mark as read
              </SubmitButton>
            </form>
          ) : (
            <form action={markMessageUnread}>
              {hidden}
              <SubmitButton pendingLabel="Marking…" className={`${buttonStyles.secondary} w-full sm:w-auto`}>
                <Mail className="size-5" strokeWidth={1.75} aria-hidden="true" />
                Mark as unread
              </SubmitButton>
            </form>
          )}
          {archived ? (
            <form action={unarchiveMessage}>
              {hidden}
              <SubmitButton
                pendingLabel="Restoring…"
                className={`${buttonStyles.secondary} w-full sm:w-auto`}
              >
                <ArchiveRestore className="size-5" strokeWidth={1.75} aria-hidden="true" />
                Take out of the archive
              </SubmitButton>
            </form>
          ) : (
            <form action={archiveMessage}>
              {hidden}
              <SubmitButton
                pendingLabel="Archiving…"
                className={`${buttonStyles.secondary} w-full sm:w-auto`}
              >
                <Archive className="size-5" strokeWidth={1.75} aria-hidden="true" />
                Archive
              </SubmitButton>
            </form>
          )}
        </div>
      </article>
      <p className="max-w-[760px] text-caption text-muted">
        This page doesn’t send replies. To answer, write to the visitor from your own email.
      </p>
    </>
  );
}
