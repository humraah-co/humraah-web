import type { Metadata } from "next";
import { LogOut } from "lucide-react";
import { signOut } from "@/app/admin/actions";
import { ChangePasswordForm } from "@/components/admin/AccountForm";
import { PageHeader } from "@/components/admin/Workspace";
import { buttonStyles } from "@/components/ui/Button";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { requireActiveMember } from "@/lib/admin/session";
import { roleLabels } from "@/lib/admin/team";

export const metadata: Metadata = { title: "Your account" };

const sectionClass = "flex flex-col gap-4 rounded-[20px] border border-border-soft bg-card p-5 lg:p-6";

/** Any signed-in team member: who they are, a new password, and sign out. Nothing else. */
export default async function AccountPage() {
  const { member } = await requireActiveMember();
  const details = [
    ["Name", member.full_name || "Not set"],
    ["Email", member.email],
    ["Role", roleLabels[member.role]],
  ];
  return (
    <>
      <PageHeader title="Your account" description="Your details, your password and signing out." />

      <section aria-labelledby="details" className={sectionClass}>
        <h2 id="details" className="text-h3">
          Your details
        </h2>
        <dl className="grid gap-4 sm:grid-cols-3">
          {details.map(([label, value]) => (
            <div key={label} className="flex min-w-0 flex-col gap-0.5">
              <dt className="text-label-s text-muted">{label}</dt>
              <dd className="text-body-m break-words">{value}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section aria-labelledby="password" className={sectionClass}>
        <h2 id="password" className="text-h3">
          Change password
        </h2>
        <ChangePasswordForm />
      </section>

      <section aria-labelledby="sign-out" className={sectionClass}>
        <h2 id="sign-out" className="text-h3">
          Sign out
        </h2>
        <form action={signOut}>
          <SubmitButton pendingLabel="Signing out…" className={`${buttonStyles.secondary} gap-2`}>
            <LogOut className="size-5" strokeWidth={1.75} aria-hidden="true" />
            Sign out
          </SubmitButton>
        </form>
      </section>
    </>
  );
}
