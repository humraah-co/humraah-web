import type { Metadata } from "next";
import { Info, Plus } from "lucide-react";
import { InviteForm } from "@/components/admin/InviteForm";
import { Modal } from "@/components/admin/Modal";
import { Avatar, PageHeader } from "@/components/admin/Workspace";
import { ButtonLink, buttonStyles } from "@/components/ui/Button";
import { Chip, type ChipTone } from "@/components/ui/Chip";
import { FormAlert, FormNotice } from "@/components/ui/Field";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { getSessionClient, requireActiveMember, type Member } from "@/lib/admin/session";
import { canManage, invitableRoles, isAdminRole, roleLabels, statusLabels } from "@/lib/admin/team";
import type { MemberStatus, TeamRole } from "@/lib/database.types";
import { dayLabel, timeAgo } from "@/lib/format";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  reactivateMember,
  resendInvite,
  revokeInvite,
  suspendMember,
  type TeamError,
  type TeamNotice,
} from "./actions";

export const metadata: Metadata = { title: "Team" };

const TEAM_PATH = "/admin/team";

type TeamRow = Member & { created_at: string };

const roleOrder: Record<TeamRole, number> = { owner: 0, admin: 1, researcher: 2 };
const statusOrder: Record<MemberStatus, number> = { active: 0, invited: 1, suspended: 2 };
const roleTones: Record<TeamRole, ChipTone> = { owner: "lavender", admin: "lavender", researcher: "outline" };
const statusTones: Record<MemberStatus, ChipTone> = {
  active: "sage",
  invited: "blush",
  suspended: "outline",
};

const errors: Record<TeamError, string> = {
  "not-allowed": "You don’t have permission to do that.",
  "not-pending": "That invite has already been accepted or withdrawn.",
  "not-found": "That person isn’t on the team any more.",
  "no-service-key": "Invites aren’t set up on this server yet: SUPABASE_SERVICE_ROLE_KEY is missing.",
  "rate-limit": "Supabase’s limit on emails has been reached. Please try again in an hour.",
  failed: "Something went wrong. Please refresh the page and try again.",
};

function noticeText(notice: TeamNotice, who: TeamRow | undefined) {
  const name = who ? who.full_name || who.email : "They";
  switch (notice) {
    case "invited":
      return who ? `Invite sent to ${who.email}.` : "Invite sent.";
    case "resent":
      return who ? `Invite sent again to ${who.email}.` : "Invite sent again.";
    case "revoked":
      return "Invite withdrawn. The link in their email no longer works.";
    case "suspended":
      return `${name} is suspended and has been signed out of the workspace.`;
    case "reactivated":
      return `${name} can sign in again.`;
  }
}

/** When each person last signed in, from Supabase Auth (needs the service-role key). */
async function lastSignIns() {
  const admin = createAdminClient();
  if (!admin) return null;
  const { data, error } = await admin.auth.admin.listUsers({ perPage: 1000 });
  if (error) return null;
  return new Map(data.users.map((u) => [u.id, u.last_sign_in_at ?? null]));
}

type Search = {
  invite?: string;
  confirm?: string;
  id?: string;
  notice?: string;
  error?: string;
};

/**
 * Admin – Team (Figma 36:4215) and the invite modal (36:4413). Everyone on
 * the team can see the list; admins and the owner can manage it.
 */
export default async function TeamPage({ searchParams }: { searchParams: Promise<Search> }) {
  const supabase = await getSessionClient();
  // Loaded alongside the membership check; nothing renders until it passes.
  const [{ member: me }, params, membersResult, signIns] = await Promise.all([
    requireActiveMember(),
    searchParams,
    supabase.from("team_members").select("user_id, email, full_name, role, status, created_at"),
    lastSignIns(),
  ]);

  const members = ((membersResult.data ?? []) as TeamRow[]).sort(
    (a, b) =>
      roleOrder[a.role] - roleOrder[b.role] ||
      statusOrder[a.status] - statusOrder[b.status] ||
      (a.full_name || a.email).localeCompare(b.full_name || b.email),
  );
  const manager = isAdminRole(me.role);
  const roles = invitableRoles(me);
  const byId = (id?: string) => members.find((m) => m.user_id === id);

  const notice = params.notice as TeamNotice | undefined;
  const noticeMessage = notice ? noticeText(notice, byId(params.id)) : undefined;
  const errorMessage = errors[params.error as TeamError];

  const confirming =
    params.confirm === "suspend" || params.confirm === "revoke" ? byId(params.id) : undefined;
  const showConfirm = confirming && canManage(me, confirming);

  return (
    <>
      <PageHeader
        title="Team"
        description={
          manager
            ? "Invite researchers and manage who can edit content."
            : "Everyone who can edit content. Ask an admin to make changes."
        }
      >
        {manager && (
          <ButtonLink href={`${TEAM_PATH}?invite=1`}>
            <Plus className="size-5" strokeWidth={1.75} aria-hidden="true" />
            Invite researcher
          </ButtonLink>
        )}
      </PageHeader>

      <p className="flex items-center gap-2.5 rounded-2xl bg-tint-lavender p-4 text-body-s">
        <Info className="size-5 shrink-0" strokeWidth={1.75} aria-hidden="true" />
        Researchers can add, edit, publish and archive entries. Only admins can permanently delete, restore
        archived entries and manage the team.
      </p>

      {noticeMessage && <FormNotice>{noticeMessage}</FormNotice>}
      {errorMessage && <FormAlert>{errorMessage}</FormAlert>}
      {membersResult.error && <FormAlert>We couldn’t load the team. Please refresh the page.</FormAlert>}

      {!membersResult.error && (
        <div className="overflow-hidden rounded-[20px] border border-border-soft bg-card">
          <table className="w-full text-left">
            <caption className="sr-only">Team members</caption>
            <thead className="hidden bg-cream md:table-header-group">
              <tr className="text-label-s text-muted">
                <th scope="col" className="px-6 py-3 font-semibold">
                  Name
                </th>
                <th scope="col" className="w-[150px] py-3 font-semibold">
                  Role
                </th>
                <th scope="col" className="w-[140px] py-3 font-semibold">
                  Status
                </th>
                <th scope="col" className="w-[150px] py-3 font-semibold">
                  Last active
                </th>
                <th scope="col" className="w-[170px] py-3 pr-6">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {members.map((m) => (
                <MemberRow key={m.user_id} member={m} me={me} lastSignIn={signIns?.get(m.user_id)} />
              ))}
            </tbody>
          </table>
        </div>
      )}

      {params.invite && manager && (
        <Modal title="Invite a team member" closeHref={TEAM_PATH}>
          <InviteForm roles={roles} closeHref={TEAM_PATH} />
        </Modal>
      )}

      {showConfirm && <ConfirmModal kind={params.confirm as "suspend" | "revoke"} member={confirming} />}
    </>
  );
}

function lastActive(member: TeamRow, lastSignIn: string | null | undefined) {
  if (member.status === "invited") return `Invited ${timeAgo(member.created_at).toLowerCase()}`;
  if (lastSignIn === undefined) return "–";
  return lastSignIn ? dayLabel(lastSignIn) : "Never";
}

const textButton = buttonStyles.text;

/** Admin/Member row (26:413). On a phone the columns stack. */
function MemberRow({
  member,
  me,
  lastSignIn,
}: {
  member: TeamRow;
  me: Member;
  lastSignIn: string | null | undefined;
}) {
  const name = member.full_name || member.email;
  const isMe = member.user_id === me.user_id;
  const manageable = canManage(me, member);
  const hidden = <input type="hidden" name="user_id" value={member.user_id} />;
  return (
    <tr className="flex flex-wrap items-center gap-x-3 gap-y-2 border-t border-border-soft px-5 py-3.5 first:border-t-0 md:table-row md:border-t md:px-0 md:first:border-t">
      <td className="w-full md:w-auto md:py-3.5 md:pl-6">
        <div className="flex items-center gap-3">
          <Avatar name={name} toneKey={member.user_id} />
          <div className="min-w-0">
            <p className="truncate text-label-m">{name}</p>
            <p className="truncate text-caption text-muted">{member.email}</p>
          </div>
        </div>
      </td>
      <td className="md:py-3.5">
        <span className="sr-only md:hidden">Role: </span>
        <Chip tone={roleTones[member.role]}>{roleLabels[member.role]}</Chip>
      </td>
      <td className="md:py-3.5">
        <span className="sr-only md:hidden">Status: </span>
        <Chip tone={statusTones[member.status]}>{statusLabels[member.status]}</Chip>
      </td>
      <td className="w-full text-body-s md:w-auto md:py-3.5">
        <span className="text-muted md:hidden">Last active: </span>
        {lastActive(member, lastSignIn)}
      </td>
      <td className="md:py-3.5 md:pr-6 md:text-right">
        {isMe ? (
          <span className="py-2.5 text-label-m text-muted">You</span>
        ) : manageable ? (
          <div className="flex flex-wrap items-center gap-x-4 md:justify-end">
            {member.status === "invited" && (
              <>
                <form action={resendInvite}>
                  {hidden}
                  <SubmitButton pendingLabel="Sending…" className={textButton}>
                    Resend<span className="sr-only"> the invite to {name}</span>
                  </SubmitButton>
                </form>
                <ButtonLink href={`${TEAM_PATH}?confirm=revoke&id=${member.user_id}`} variant="text">
                  Revoke<span className="sr-only"> the invite for {name}</span>
                </ButtonLink>
              </>
            )}
            {member.status === "active" && (
              <ButtonLink href={`${TEAM_PATH}?confirm=suspend&id=${member.user_id}`} variant="text">
                Suspend<span className="sr-only"> {name}</span>
              </ButtonLink>
            )}
            {member.status === "suspended" && (
              <form action={reactivateMember}>
                {hidden}
                <SubmitButton pendingLabel="Reactivating…" className={textButton}>
                  Reactivate<span className="sr-only"> {name}</span>
                </SubmitButton>
              </form>
            )}
          </div>
        ) : null}
      </td>
    </tr>
  );
}

function ConfirmModal({ kind, member }: { kind: "suspend" | "revoke"; member: TeamRow }) {
  const name = member.full_name || member.email;
  const copy =
    kind === "suspend"
      ? {
          title: `Suspend ${name}?`,
          body: "They’ll be signed out straight away and can’t use the workspace until an admin reactivates them. Their entries stay as they are.",
          action: suspendMember,
          button: "Suspend",
          pending: "Suspending…",
        }
      : {
          title: `Withdraw the invite for ${name}?`,
          body: `The link sent to ${member.email} will stop working. You can invite them again later.`,
          action: revokeInvite,
          button: "Revoke invite",
          pending: "Revoking…",
        };
  return (
    <Modal title={copy.title} closeHref={TEAM_PATH}>
      <p className="text-body-s text-muted">{copy.body}</p>
      <form action={copy.action} className="flex flex-col-reverse gap-2.5 sm:flex-row sm:justify-end">
        <input type="hidden" name="user_id" value={member.user_id} />
        <ButtonLink href={TEAM_PATH} variant="secondary">
          Cancel
        </ButtonLink>
        <SubmitButton pendingLabel={copy.pending} className={buttonStyles.primary}>
          {copy.button}
        </SubmitButton>
      </form>
    </Modal>
  );
}
