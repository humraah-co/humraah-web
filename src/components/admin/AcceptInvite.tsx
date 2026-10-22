"use client";

import { useActionState, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { acceptInvite, type AcceptInviteState } from "@/app/admin/(auth)/actions";
import { PasswordFields } from "@/components/admin/AuthForms";
import { buttonStyles } from "@/components/ui/Button";
import { Field, FormAlert, fieldClass } from "@/components/ui/Field";
import { NAME_MAX } from "@/lib/admin/forms";
import { LOGIN_PATH } from "@/lib/admin/paths";
import { createBrowserSessionClient } from "@/lib/supabase/browser";

/** Name and password for an invited person who has opened their link. */
export function AcceptInviteForm({ name }: { name: string | null }) {
  const [state, action, pending] = useActionState<AcceptInviteState, FormData>(acceptInvite, {
    status: "idle",
  });
  const errors = state.status === "invalid" ? state.errors : {};
  return (
    <form action={action} noValidate className="flex flex-col gap-[18px]">
      {errors.form && <FormAlert>{errors.form}</FormAlert>}
      <Field id="name" label="Your name" error={errors.name} hint="Shown to the rest of the team.">
        <input
          id="name"
          name="name"
          type="text"
          autoComplete="name"
          required
          maxLength={NAME_MAX}
          defaultValue={state.status === "invalid" ? state.name : (name ?? undefined)}
          aria-invalid={!!errors.name}
          aria-describedby={errors.name ? "name-error" : "name-hint"}
          className={`${fieldClass} h-12`}
        />
      </Field>
      <PasswordFields errors={errors} />
      <button
        type="submit"
        disabled={pending}
        className={`${buttonStyles.primary} w-full disabled:opacity-70`}
      >
        {pending ? "Setting up…" : "Join the team"}
      </button>
    </form>
  );
}

type LinkState = "checking" | "expired" | "missing";

/**
 * Invite links arrive as /admin/accept-invite#access_token=…&refresh_token=…
 * (or #error=… when the link has expired). The fragment never reaches the
 * server, so this reads it, stores the session as cookies, removes the
 * tokens from the address bar and reloads the page as the invited person.
 */
export function InviteLink({ linkError }: { linkError: boolean }) {
  const router = useRouter();
  const [state, setState] = useState<LinkState>(linkError ? "expired" : "checking");

  useEffect(() => {
    if (linkError) return;
    const hash = new URLSearchParams(window.location.hash.slice(1));
    const accessToken = hash.get("access_token");
    const refreshToken = hash.get("refresh_token");
    const supabase = createBrowserSessionClient();
    if (hash.has("error") || hash.has("error_code")) {
      setState("expired");
    } else if (!accessToken || !refreshToken || !supabase) {
      setState("missing");
    } else {
      supabase.auth
        .setSession({ access_token: accessToken, refresh_token: refreshToken })
        .then(({ error }) => {
          window.history.replaceState(null, "", window.location.pathname);
          if (error) setState("expired");
          else router.refresh();
        });
      return;
    }
    if (window.location.hash) window.history.replaceState(null, "", window.location.pathname);
  }, [linkError, router]);

  if (state === "checking") {
    return (
      <p role="status" className="text-body-m text-muted">
        Checking your invite link…
      </p>
    );
  }
  return (
    <>
      <p className="text-body-m text-muted">
        {state === "expired"
          ? "This invite link has expired or has already been used. Ask the admin who invited you to send a new one."
          : "Open the link in your invite email to set up your account."}
      </p>
      <p className="text-body-m text-muted">
        Already set up your account?{" "}
        <Link href={LOGIN_PATH} className="text-deep-rose underline underline-offset-2">
          Sign in
        </Link>
        .
      </p>
    </>
  );
}
