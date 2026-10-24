"use client";

import { useFormStatus } from "react-dom";
import { LoaderCircle } from "lucide-react";
import { useNavFormPending } from "./NavForm";

/**
 * A submit button that answers the click straight away: disabled, with
 * `pendingLabel` ("Saving…"), until the form's action or navigation
 * finishes. Works inside any <form> with a server action or a next/form
 * <Form>; without JavaScript it's an ordinary submit button.
 *
 * For an icon-only button, pass `label` (its accessible name); while
 * pending the icon becomes a spinner and the name becomes `pendingLabel`.
 */
export function SubmitButton({
  children,
  pendingLabel,
  label,
  className = "",
  title,
}: {
  children: React.ReactNode;
  pendingLabel: string;
  /** Accessible name for icon-only buttons. */
  label?: string;
  className?: string;
  title?: string;
}) {
  const status = useFormStatus();
  const navigating = useNavFormPending();
  const pending = status.pending || navigating;
  const iconOnly = label !== undefined;
  return (
    <button
      type="submit"
      disabled={pending}
      aria-label={iconOnly ? (pending ? pendingLabel : label) : undefined}
      title={title}
      className={`cursor-pointer disabled:cursor-progress disabled:opacity-70 ${className}`}
    >
      {iconOnly ? (
        pending ? (
          <LoaderCircle className="size-5 motion-safe:animate-spin" strokeWidth={1.75} aria-hidden="true" />
        ) : (
          children
        )
      ) : pending ? (
        pendingLabel
      ) : (
        children
      )}
    </button>
  );
}
