import type { Metadata } from "next";
import { NewPasswordForm } from "@/components/admin/AuthForms";
import { ButtonLink } from "@/components/ui/Button";
import { getAdminSession } from "@/lib/admin/session";
import { FORGOT_PASSWORD_PATH } from "@/lib/admin/paths";

export const metadata: Metadata = { title: "Choose a new password" };

/** Reached from the reset email, through /admin/auth/confirm, which signs the person in. */
export default async function ResetPasswordPage() {
  const session = await getAdminSession();
  if (!session?.user) {
    return (
      <>
        <h1 className="text-h1 lg:tracking-[-0.2px]">This link has expired</h1>
        <p className="text-body-m text-muted">
          Reset links work once, for a limited time, in the browser where you asked for them. Ask for a new
          one and open it here.
        </p>
        <ButtonLink href={FORGOT_PASSWORD_PATH} className="w-full">
          Send a new link
        </ButtonLink>
      </>
    );
  }
  return (
    <>
      <header className="flex flex-col gap-[18px]">
        <h1 className="text-h1 lg:tracking-[-0.2px]">Choose a new password</h1>
        <p className="text-body-m text-muted">
          For <span className="font-semibold text-charcoal">{session.user.email}</span>. You’ll use it the
          next time you sign in.
        </p>
      </header>
      <NewPasswordForm />
    </>
  );
}
