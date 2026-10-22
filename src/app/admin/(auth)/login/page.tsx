import type { Metadata } from "next";
import { SignInForm } from "@/components/admin/AuthForms";
import { FormAlert, FormNotice } from "@/components/ui/Field";
import { safeNextPath } from "@/lib/admin/paths";
import { getSupabaseEnv } from "@/lib/supabase/env";

export const metadata: Metadata = { title: "Sign in" };

const notices: Record<string, string> = {
  "signed-out": "You’ve signed out.",
};

const problems: Record<string, string> = {
  suspended:
    "Your access to the team workspace has been suspended, so you’ve been signed out. If you think this is a mistake, ask an admin.",
  link: "That link has expired or has already been used. Please sign in, or ask for a new link.",
};

type Search = { next?: string | string[]; notice?: string | string[]; error?: string | string[] };
const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);

/** Admin – Login (Figma 35:3104). */
export default async function LoginPage({ searchParams }: { searchParams: Promise<Search> }) {
  const params = await searchParams;
  const notice = notices[first(params.notice) ?? ""];
  const problem = problems[first(params.notice) ?? ""] ?? problems[first(params.error) ?? ""];
  return (
    <>
      <header className="flex flex-col gap-[18px]">
        <h1 className="text-h1 lg:tracking-[-0.2px]">Team sign in</h1>
        <p className="text-body-m text-muted">For Humraah team members only.</p>
      </header>
      {notice && <FormNotice>{notice}</FormNotice>}
      {problem && <FormAlert>{problem}</FormAlert>}
      {!getSupabaseEnv() && (
        <FormAlert>Sign-in isn’t available yet: Supabase isn’t set up on this server.</FormAlert>
      )}
      <SignInForm next={safeNextPath(first(params.next)) ?? undefined} />
      <p className="text-caption text-muted">Need access? Ask an admin to invite you.</p>
    </>
  );
}
