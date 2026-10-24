import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { signOut } from "@/app/admin/actions";
import { buttonStyles } from "@/components/ui/Button";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { getAdminSession } from "@/lib/admin/session";
import { LOGIN_PATH } from "@/lib/admin/paths";
import { contact } from "@/lib/nav";

export const metadata: Metadata = { title: "No access" };

/**
 * For someone signed in without a team membership (the middleware sends
 * them here). The only thing they can do is sign out.
 */
export default async function NoAccessPage() {
  const session = await getAdminSession();
  if (!session?.user) redirect(LOGIN_PATH);
  return (
    <>
      <header className="flex flex-col gap-[18px]">
        <h1 className="text-h1 lg:tracking-[-0.2px]">No access</h1>
        <p className="text-body-m text-muted">
          You’re signed in as <span className="font-semibold text-charcoal">{session.user.email}</span>, but
          this account isn’t part of the Humraah team workspace.
        </p>
        <p className="text-body-m text-muted">
          If you should have access, ask an admin to invite you, or email{" "}
          <a href={`mailto:${contact.email}`} className="text-deep-rose underline underline-offset-2">
            {contact.email}
          </a>
          .
        </p>
      </header>
      <form action={signOut}>
        <SubmitButton pendingLabel="Signing out…" className={`${buttonStyles.primary} w-full`}>
          Sign out
        </SubmitButton>
      </form>
    </>
  );
}
