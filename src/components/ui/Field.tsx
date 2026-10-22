import { CircleAlert } from "lucide-react";

/** Input/Field from Figma (4:182): 48 px field, strong border, deep-rose border when invalid. */
export const fieldClass =
  "w-full rounded-xl border border-border-strong bg-card px-3.5 text-body-m text-charcoal placeholder:text-muted aria-[invalid=true]:border-deep-rose aria-[invalid=true]:border-2";

/** Checkbox/Box from Figma: coral tint with a tick when checked. Add the size and radius (22 or 24 px). */
export const checkboxClass =
  "shrink-0 cursor-pointer appearance-none border-[1.5px] border-muted bg-card bg-center bg-no-repeat checked:border-deep-rose checked:bg-tint-coral checked:bg-[url('/brand/check.svg')] aria-[invalid=true]:border-deep-rose";

/** A label, its control and (when there is one) the error under it. */
export function Field({
  id,
  label,
  error,
  hint,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-label-m">
        {label}
      </label>
      {children}
      {hint && !error && (
        <p id={`${id}-hint`} className="text-caption text-muted">
          {hint}
        </p>
      )}
      {error && <ErrorText id={`${id}-error`}>{error}</ErrorText>}
    </div>
  );
}

export function ErrorText({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <p id={id} className="flex items-center gap-1.5 text-body-s text-deep-rose">
      <CircleAlert className="size-4 shrink-0" strokeWidth={1.75} aria-hidden="true" />
      {children}
    </p>
  );
}

/** A form-level problem, e.g. "We couldn't send your message". */
export function FormAlert({ children }: { children: React.ReactNode }) {
  return (
    <p role="alert" className="flex items-start gap-2 rounded-2xl bg-tint-coral p-3.5 text-body-s">
      <CircleAlert className="mt-0.5 size-5 shrink-0 text-deep-rose" strokeWidth={1.75} aria-hidden="true" />
      <span>{children}</span>
    </p>
  );
}

/** A form-level confirmation, e.g. "Check your email". */
export function FormNotice({ children }: { children: React.ReactNode }) {
  return (
    <p role="status" className="rounded-2xl bg-tint-sage p-3.5 text-body-s">
      {children}
    </p>
  );
}
