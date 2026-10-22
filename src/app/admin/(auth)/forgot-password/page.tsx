import type { Metadata } from "next";
import { ForgotPasswordForm } from "@/components/admin/AuthForms";
import { FormAlert } from "@/components/ui/Field";

export const metadata: Metadata = { title: "Reset your password" };

export default async function ForgotPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string | string[] }>;
}) {
  const { error } = await searchParams;
  return (
    <>
      <header className="flex flex-col gap-[18px]">
        <h1 className="text-h1 lg:tracking-[-0.2px]">Reset your password</h1>
        <p className="text-body-m text-muted">
          Enter the email you sign in with and we’ll send you a link to choose a new password.
        </p>
      </header>
      {error === "link" && (
        <FormAlert>
          That reset link has expired, has already been used or was opened in a different browser. Please ask
          for a new one.
        </FormAlert>
      )}
      <ForgotPasswordForm />
    </>
  );
}
