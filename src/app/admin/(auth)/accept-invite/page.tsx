import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { signOut } from "@/app/admin/actions";
import { AcceptInviteForm, InviteLink } from "@/components/admin/AcceptInvite";
import { buttonStyles } from "@/components/ui/Button";
import { ADMIN_HOME } from "@/lib/admin/paths";
import { getAdminSession } from "@/lib/admin/session";

export const metadata: Metadata = { title: "Join the team" };

const heading = <h1 className="text-h1 lg:tracking-[-0.2px]">Join the Humraah team</h1>;

/**
 * Where invite emails land (the redirect set by the invite action). The
 * link signs the person in; here they choose their name and password, and
 * their team_members status becomes active.
 */
export default async function AcceptInvitePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string | string[] }>;
}) {
  const { error } = await searchParams;
  const session = await getAdminSession();

  if (!session?.user) {
    return (
      <>
        {heading}
        <InviteLink linkError={error === "link"} />
      </>
    );
  }

  const { user, member } = session;
  if (member?.status === "active") redirect(ADMIN_HOME);
  if (member?.status !== "invited") {
    return (
      <>
        {heading}
        <p className="text-body-m text-muted">
          There’s no invite waiting for <span className="font-semibold text-charcoal">{user.email}</span>. It
          may have been withdrawn. If you think this is a mistake, ask an admin.
        </p>
        <form action={signOut}>
          <button type="submit" className={`${buttonStyles.secondary} w-full`}>
            Sign out
          </button>
        </form>
      </>
    );
  }

  return (
    <>
      <header className="flex flex-col gap-[18px]">
        {heading}
        <p className="text-body-m text-muted">
          You’ve been invited as <span className="font-semibold text-charcoal">{user.email}</span>. Add your
          name and choose a password. Nobody else ever sees it.
        </p>
      </header>
      <AcceptInviteForm name={member.full_name} />
    </>
  );
}
