"use client";

import { useActionState } from "react";
import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { inviteMember, type InviteState } from "@/app/admin/(portal)/team/actions";
import { buttonStyles } from "@/components/ui/Button";
import { Field, FormAlert, fieldClass } from "@/components/ui/Field";
import { EMAIL_MAX, NAME_MAX } from "@/lib/admin/forms";
import { roleLabels } from "@/lib/admin/team";
import type { TeamRole } from "@/lib/database.types";

/** The form inside the invite modal (Figma 36:4440), plus a name field. */
export function InviteForm({ roles, closeHref }: { roles: TeamRole[]; closeHref: string }) {
  const [state, action, pending] = useActionState<InviteState, FormData>(inviteMember, { status: "idle" });
  const errors = state.status === "invalid" ? state.errors : {};
  const values = state.status === "invalid" ? state.values : undefined;
  const describedBy = (field: "email" | "name" | "role") => (errors[field] ? `${field}-error` : undefined);
  return (
    <form action={action} noValidate className="flex flex-col gap-4">
      <p className="text-body-s text-muted">
        They’ll get an email with a link to set their own password. Nobody else ever sees it.
      </p>
      {errors.form && <FormAlert>{errors.form}</FormAlert>}
      <Field id="email" label="Email address" error={errors.email}>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="off"
          inputMode="email"
          required
          maxLength={EMAIL_MAX}
          defaultValue={values?.email}
          placeholder="name@example.com"
          aria-invalid={!!errors.email}
          aria-describedby={describedBy("email")}
          className={`${fieldClass} h-12`}
        />
      </Field>
      <Field id="name" label="Name" error={errors.name}>
        <input
          id="name"
          name="name"
          type="text"
          autoComplete="off"
          required
          maxLength={NAME_MAX}
          defaultValue={values?.name}
          placeholder="Their full name"
          aria-invalid={!!errors.name}
          aria-describedby={describedBy("name")}
          className={`${fieldClass} h-12`}
        />
      </Field>
      <Field id="role" label="Role" error={errors.role}>
        <div className="relative">
          <select
            id="role"
            name="role"
            defaultValue={values?.role ?? "researcher"}
            aria-invalid={!!errors.role}
            aria-describedby={describedBy("role") ?? "role-note"}
            className={`${fieldClass} h-12 cursor-pointer appearance-none pr-11`}
          >
            {roles.map((role) => (
              <option key={role} value={role}>
                {roleLabels[role]}
              </option>
            ))}
          </select>
          <ChevronDown
            className="pointer-events-none absolute top-1/2 right-3.5 size-5 -translate-y-1/2"
            strokeWidth={1.75}
            aria-hidden="true"
          />
        </div>
      </Field>
      <p id="role-note" className="text-caption text-muted">
        Researchers can add, edit, publish and archive entries. Admins can also permanently delete, restore
        entries and manage the team.
        {!roles.includes("admin") && " Only the owner can invite admins."}
      </p>
      <div className="flex flex-col-reverse gap-2.5 sm:flex-row sm:justify-end">
        <Link href={closeHref} scroll={false} className={buttonStyles.secondary}>
          Cancel
        </Link>
        <button type="submit" disabled={pending} className={`${buttonStyles.primary} disabled:opacity-70`}>
          {pending ? "Sending…" : "Send invite"}
        </button>
      </div>
    </form>
  );
}
