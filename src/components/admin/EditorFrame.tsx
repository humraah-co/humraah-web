"use client";

import { startTransition, useActionState, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Check, ChevronRight, CircleAlert } from "lucide-react";
import { StatusChip } from "@/components/admin/EntryChips";
import { TextInput, fieldId } from "@/components/admin/EditorParts";
import { useUnsavedChanges } from "@/components/admin/useUnsavedChanges";
import { ButtonLink, buttonStyles } from "@/components/ui/Button";
import { UnverifiedBadge, VerifiedBadge } from "@/components/ui/Chip";
import { FormAlert, FormNotice } from "@/components/ui/Field";
import {
  entryTypes,
  errorList,
  type EntryTable,
  type FieldErrors,
  type SaveIntent,
  type SaveState,
} from "@/lib/admin/content";
import type { ContentStatus } from "@/lib/database.types";
import { formatLongDate } from "@/lib/format";

/** What the server page knows about the entry being edited. */
export type EditorMeta = {
  table: EntryTable;
  /** Null for a new entry. */
  id: string | null;
  status: ContentStatus | null;
  /** The saved name, for the title (the field may be mid-edit). */
  title: string;
  /** "Saved 3 minutes ago by Ina Khan". */
  savedLine?: string;
  verifiedAt: string | null;
  verifiedBy?: string;
  /** The public page, for published entries. */
  viewHref?: string;
  /** Admins and the owner can restore and delete archived entries. */
  isAdmin: boolean;
};

const disabledStyle = "disabled:cursor-not-allowed disabled:opacity-70";

/**
 * Admin – Edit university (Figma 36:3943), shared by both editors: the
 * header with the save buttons, the error summary, the main cards and a
 * side column with Verification and Recent changes.
 *
 * Values are controlled by the editor and sent as one JSON object, with the
 * button pressed as the intent. Success redirects (with a notice); problems
 * come back as messages next to each field and nothing is saved.
 */
export function EditorFrame<V>({
  meta,
  initial,
  values,
  labels,
  action,
  notice,
  source,
  recent,
  children,
}: {
  meta: EditorMeta;
  /** The values as saved, to tell when there are unsaved changes. */
  initial: V;
  values: V;
  labels: Record<string, string>;
  action: (state: SaveState, form: FormData) => Promise<SaveState>;
  notice?: { text: string; tone: "success" | "problem" };
  source: { value: string; onChange: (value: string) => void };
  recent?: React.ReactNode;
  children: (errors: FieldErrors, readOnly: boolean) => React.ReactNode;
}) {
  const [state, dispatch, pending] = useActionState(action, { status: "idle" });
  const [intent, setIntent] = useState<SaveIntent | null>(null);
  const summaryRef = useRef<HTMLDivElement>(null);
  const errors = state.status === "invalid" ? state.errors : {};
  const problems = errorList(errors, labels);
  const readOnly = meta.status === "archived";
  const published = meta.status === "published";
  const type = entryTypes[meta.table];
  const entryHref = `${type.adminPath}/${meta.id}`;
  const dirty = !readOnly && JSON.stringify(values) !== JSON.stringify(initial);
  useUnsavedChanges(dirty);

  // After a refused save, focus the first field to fix (or the message when it isn't about a field).
  useEffect(() => {
    if (state.status !== "invalid") return;
    const first = errorList(state.errors, labels)[0];
    const target = first ? document.getElementById(fieldId(first.key)) : summaryRef.current;
    target?.focus();
  }, [state, labels]);

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const button = (event.nativeEvent as SubmitEvent).submitter;
    const chosen = (button instanceof HTMLButtonElement ? button.value : "") as SaveIntent;
    if (!chosen || pending) return;
    setIntent(chosen);
    const form = new FormData();
    form.set("intent", chosen);
    if (meta.id) form.set("id", meta.id);
    form.set("values", JSON.stringify(values));
    startTransition(() => dispatch(form));
  }

  // Enter in a text box shouldn't press whichever button comes first.
  function blockImplicitSubmit(event: React.KeyboardEvent<HTMLFormElement>) {
    if (event.key === "Enter" && event.target instanceof HTMLInputElement) event.preventDefault();
  }

  const button = (value: SaveIntent, label: string, busy: string, style: string) => (
    <button
      type="submit"
      name="intent"
      value={value}
      disabled={pending}
      className={`${style} ${disabledStyle}`}
    >
      {pending && intent === value ? busy : label}
    </button>
  );

  return (
    <form
      onSubmit={submit}
      onKeyDown={blockImplicitSubmit}
      noValidate
      className="flex flex-col gap-6 lg:gap-7"
    >
      <header className="flex flex-col gap-4 xl:flex-row xl:items-end">
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-body-s">
            <Link href={type.adminPath} className={buttonStyles.text}>
              {type.label}
            </Link>
            <ChevronRight className="size-4" strokeWidth={1.75} aria-hidden="true" />
            <span aria-current="page" className="text-muted">
              {meta.id ? "Edit entry" : "New entry"}
            </span>
          </nav>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
            <h1 className="text-h1 break-words lg:tracking-[-0.2px]">{meta.title}</h1>
            {meta.status && <StatusChip status={meta.status} />}
            {dirty ? (
              <p className="text-label-s text-deep-rose">Unsaved changes</p>
            ) : (
              meta.savedLine && <p className="text-caption text-muted">{meta.savedLine}</p>
            )}
          </div>
        </div>
        <div className="flex flex-col gap-2.5 sm:flex-row sm:flex-wrap sm:items-center">
          {meta.viewHref && (
            <ButtonLink href={meta.viewHref} variant="secondary" external>
              View on site
            </ButtonLink>
          )}
          {!readOnly &&
            (published ? (
              <>
                {button("unpublish", "Move to drafts", "Moving…", buttonStyles.secondary)}
                {button("update", "Update", "Updating…", buttonStyles.primary)}
              </>
            ) : (
              <>
                {button("draft", "Save draft", "Saving…", buttonStyles.secondary)}
                {button("publish", "Publish", "Publishing…", buttonStyles.primary)}
              </>
            ))}
          {meta.id && !readOnly && (
            <ButtonLink href={`${entryHref}?confirm=archive`} variant="text" className="sm:ml-1">
              Archive<span className="sr-only"> {meta.title}</span>
            </ButtonLink>
          )}
          {meta.id && readOnly && meta.isAdmin && (
            <>
              <ButtonLink href={`${entryHref}?confirm=restore`} variant="secondary">
                Restore to drafts
              </ButtonLink>
              <ButtonLink href={`${entryHref}?confirm=delete`} variant="text" className="sm:ml-1">
                Delete permanently
              </ButtonLink>
            </>
          )}
        </div>
      </header>

      {notice &&
        (notice.tone === "success" ? (
          <FormNotice>{notice.text}</FormNotice>
        ) : (
          <FormAlert>{notice.text}</FormAlert>
        ))}

      {readOnly && (
        <p className="rounded-2xl bg-tint-lavender p-4 text-body-s">
          This {type.one} is archived, so it isn’t on the site and can’t be edited.{" "}
          {meta.isAdmin
            ? "Restore it to drafts to make changes, or delete it permanently."
            : "Only admins can restore archived entries."}
        </p>
      )}

      {state.status === "invalid" && (
        <div
          ref={summaryRef}
          tabIndex={-1}
          role="alert"
          className="rounded-2xl bg-tint-coral p-4 outline-none"
        >
          {state.form ? (
            <p className="flex items-start gap-2 text-body-s">
              <CircleAlert
                className="mt-0.5 size-5 shrink-0 text-deep-rose"
                strokeWidth={1.75}
                aria-hidden="true"
              />
              {state.form}
            </p>
          ) : (
            <>
              <p className="flex items-center gap-2 text-label-m">
                <CircleAlert
                  className="size-5 shrink-0 text-deep-rose"
                  strokeWidth={1.75}
                  aria-hidden="true"
                />
                {problems.length === 1
                  ? "There’s one thing to fix before saving. Nothing has been saved yet."
                  : `There are ${problems.length} things to fix before saving. Nothing has been saved yet.`}
              </p>
              <ul className="mt-2 flex list-disc flex-col gap-1 pl-12 text-body-s">
                {problems.map((p) => (
                  <li key={p.key}>
                    <a
                      href={`#${fieldId(p.key)}`}
                      onClick={(e) => {
                        e.preventDefault();
                        document.getElementById(fieldId(p.key))?.focus();
                      }}
                      className="text-deep-rose underline underline-offset-2 hover:text-charcoal"
                    >
                      {p.label}: {p.message}
                    </a>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      )}

      <div className="flex flex-col gap-6 xl:grid xl:grid-cols-[minmax(0,1fr)_340px] xl:items-start">
        <fieldset disabled={readOnly} className="flex min-w-0 flex-col gap-6">
          <legend className="sr-only">{type.one} details</legend>
          {children(errors, readOnly)}
        </fieldset>

        <div className="flex flex-col gap-6">
          <section
            aria-labelledby="verification-title"
            className="flex flex-col gap-4 rounded-[20px] border border-border-soft bg-card p-5 lg:p-6"
          >
            <h2 id="verification-title" className="text-h3">
              Verification
            </h2>
            <fieldset disabled={readOnly} className="flex flex-col gap-4">
              <TextInput
                name="source_url"
                label="Official source link"
                type="url"
                inputMode="url"
                placeholder="https://"
                maxLength={500}
                value={source.value}
                onChange={source.onChange}
                error={errors.source_url}
                hint="The official page you checked these details against. Needed to publish."
              />
              <div className="flex flex-wrap items-center gap-2">
                {meta.verifiedAt ? <VerifiedBadge /> : <UnverifiedBadge />}
                {meta.verifiedAt && (
                  <p className="text-caption text-muted">
                    {formatLongDate(meta.verifiedAt)}
                    {meta.verifiedBy && ` by ${meta.verifiedBy}`}
                  </p>
                )}
              </div>
              {!readOnly && (
                <button
                  type="submit"
                  name="intent"
                  value="verify"
                  disabled={pending}
                  className={`inline-flex w-full items-center justify-center gap-2 rounded-pill bg-sage px-[22px] py-3.5 text-[16px] leading-5 font-semibold text-charcoal transition-colors hover:bg-[#a5b778] ${disabledStyle}`}
                >
                  <Check className="size-5" strokeWidth={1.75} aria-hidden="true" />
                  {pending && intent === "verify" ? "Saving…" : "Mark as verified today"}
                </button>
              )}
              <p className="text-caption text-muted">
                This saves your changes too. Entries not verified for six months move to Needs review.
              </p>
            </fieldset>
          </section>
          {recent}
        </div>
      </div>
    </form>
  );
}
