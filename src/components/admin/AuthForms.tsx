"use client";

import { useActionState } from "react";
import Link from "next/link";
import {
  requestPasswordReset,
  setNewPassword,
  signIn,
  type ForgotState,
  type NewPasswordState,
  type SignInState,
} from "@/app/admin/(auth)/actions";
import { buttonStyles } from "@/components/ui/Button";
import { checkboxClass, Field, FormAlert, FormNotice, fieldClass } from "@/components/ui/Field";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { EMAIL_MAX, PASSWORD_MAX, PASSWORD_MIN } from "@/lib/admin/forms";
import { FORGOT_PASSWORD_PATH, LOGIN_PATH } from "@/lib/admin/paths";

const submitClass = `${buttonStyles.primary} w-full disabled:opacity-70`;

/** Team sign in (Figma 35:3117). Email and password only: there is no sign-up. */
export function SignInForm({ next }: { next?: string }) {
  const [state, action, pending] = useActionState<SignInState, FormData>(signIn, { status: "idle" });
  const error = state.status === "error" ? state.message : undefined;
  return (
    <form action={action} className="flex flex-col gap-[18px]">
      {next && <input type="hidden" name="next" value={next} />}
      {error && <FormAlert>{error}</FormAlert>}
      <Field id="email" label="Email address">
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="username"
          inputMode="email"
          required
          maxLength={EMAIL_MAX}
          defaultValue={state.status === "error" ? state.email : undefined}
          placeholder="name@example.com"
          aria-invalid={!!error}
          className={`${fieldClass} h-12`}
        />
      </Field>
      <Field id="password" label="Password">
        <PasswordInput
          id="password"
          name="password"
          autoComplete="current-password"
          required
          aria-invalid={!!error}
          className={`${fieldClass} h-12`}
        />
      </Field>
      <div className="flex flex-wrap items-center justify-between gap-x-4">
        <label className="flex cursor-pointer items-center gap-2.5 text-body-s">
          <input type="checkbox" name="keep" className={`size-[22px] rounded-[6px] ${checkboxClass}`} />
          Keep me signed in
        </label>
        <Link href={FORGOT_PASSWORD_PATH} className={buttonStyles.text}>
          Forgot password?
        </Link>
      </div>
      <button type="submit" disabled={pending} className={submitClass}>
        {pending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}

export function ForgotPasswordForm() {
  const [state, action, pending] = useActionState<ForgotState, FormData>(requestPasswordReset, {
    status: "idle",
  });
  if (state.status === "sent") {
    return (
      <div className="flex flex-col gap-[18px]">
        <FormNotice>
          If that email belongs to a team member, we’ve sent a link to reset the password. It can take a few
          minutes to arrive, so check your spam folder too. Open the link in this browser.
        </FormNotice>
        <Link href={LOGIN_PATH} className={`${buttonStyles.secondary} w-full`}>
          Back to sign in
        </Link>
      </div>
    );
  }
  const error = state.status === "invalid" ? state.message : undefined;
  return (
    <form action={action} noValidate className="flex flex-col gap-[18px]">
      <Field id="email" label="Email address" error={error}>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="username"
          inputMode="email"
          required
          maxLength={EMAIL_MAX}
          defaultValue={state.status === "invalid" ? state.email : undefined}
          placeholder="name@example.com"
          aria-invalid={!!error}
          aria-describedby={error ? "email-error" : undefined}
          className={`${fieldClass} h-12`}
        />
      </Field>
      <button type="submit" disabled={pending} className={submitClass}>
        {pending ? "Sending…" : "Send reset link"}
      </button>
      <Link href={LOGIN_PATH} className={`${buttonStyles.text} self-center`}>
        Back to sign in
      </Link>
    </form>
  );
}

export function NewPasswordForm() {
  const [state, action, pending] = useActionState<NewPasswordState, FormData>(setNewPassword, {
    status: "idle",
  });
  const errors = state.status === "invalid" ? state.errors : {};
  return (
    <form action={action} noValidate className="flex flex-col gap-[18px]">
      {errors.form && <FormAlert>{errors.form}</FormAlert>}
      <PasswordFields errors={errors} />
      <button type="submit" disabled={pending} className={submitClass}>
        {pending ? "Saving…" : "Save new password"}
      </button>
    </form>
  );
}

/** "New password" and "Type it again", used by the reset and accept-invite forms. */
export function PasswordFields({ errors }: { errors: { password?: string; confirm?: string } }) {
  return (
    <>
      <Field
        id="password"
        label="New password"
        error={errors.password}
        hint={`At least ${PASSWORD_MIN} characters.`}
      >
        <PasswordInput
          id="password"
          name="password"
          autoComplete="new-password"
          required
          minLength={PASSWORD_MIN}
          maxLength={PASSWORD_MAX}
          aria-invalid={!!errors.password}
          aria-describedby={errors.password ? "password-error" : "password-hint"}
          className={`${fieldClass} h-12`}
        />
      </Field>
      <Field id="confirm" label="Type it again" error={errors.confirm}>
        <PasswordInput
          id="confirm"
          name="confirm"
          autoComplete="new-password"
          required
          maxLength={PASSWORD_MAX}
          aria-invalid={!!errors.confirm}
          aria-describedby={errors.confirm ? "confirm-error" : undefined}
          className={`${fieldClass} h-12`}
        />
      </Field>
    </>
  );
}
