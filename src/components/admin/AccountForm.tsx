"use client";

import { useActionState } from "react";
import { changePassword, type ChangePasswordState } from "@/app/admin/(portal)/account/actions";
import { PasswordFields } from "@/components/admin/AuthForms";
import { buttonStyles } from "@/components/ui/Button";
import { FormAlert, FormNotice } from "@/components/ui/Field";

/** New password, typed twice (each with the show/hide eye). */
export function ChangePasswordForm() {
  const [state, action, pending] = useActionState<ChangePasswordState, FormData>(changePassword, {
    status: "idle",
  });
  const errors = state.status === "invalid" ? state.errors : {};
  return (
    <form action={action} noValidate className="flex max-w-md flex-col gap-[18px]">
      {state.status === "saved" && <FormNotice>Your password has been changed.</FormNotice>}
      {errors.form && <FormAlert>{errors.form}</FormAlert>}
      <PasswordFields errors={errors} />
      <button
        type="submit"
        disabled={pending}
        className={`${buttonStyles.primary} self-start disabled:opacity-70`}
      >
        {pending ? "Saving…" : "Change password"}
      </button>
    </form>
  );
}
