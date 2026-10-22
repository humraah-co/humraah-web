"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { CircleAlert, CircleCheck } from "lucide-react";
import { sendContactMessage } from "@/app/about/actions";
import { buttonStyles } from "@/components/ui/Button";
import { contactPrivacy } from "@/content/contactPrivacy";
import { LIMITS, type ContactField, type ContactState } from "@/lib/contact";
import { contact } from "@/lib/nav";

const fieldClass =
  "w-full rounded-xl border border-border-strong bg-card px-3.5 text-body-m text-charcoal placeholder:text-muted aria-[invalid=true]:border-deep-rose aria-[invalid=true]:border-2";

/** "Send us a message" (Figma 30:2531). Posts to a server action, so it works without JavaScript too. */
export function ContactForm() {
  // A new key gives a fresh, empty form after "Send another message".
  const [round, setRound] = useState(0);
  return <Form key={round} onReset={() => setRound((r) => r + 1)} />;
}

function Form({ onReset }: { onReset: () => void }) {
  const [state, action, pending] = useActionState<ContactState, FormData>(sendContactMessage, {
    status: "idle",
  });
  const formRef = useRef<HTMLFormElement>(null);
  const doneRef = useRef<HTMLDivElement>(null);

  // Move focus to the first problem, or to the thank-you message.
  useEffect(() => {
    if (state.status === "invalid")
      formRef.current?.querySelector<HTMLElement>("[aria-invalid=true]")?.focus();
    if (state.status === "sent") doneRef.current?.focus();
  }, [state]);

  if (state.status === "sent") {
    return (
      <div ref={doneRef} tabIndex={-1} role="status" className="flex flex-col gap-3 outline-none">
        <p className="flex items-center gap-2 text-h3">
          <CircleCheck className="size-6 text-deep-sage" strokeWidth={1.75} aria-hidden="true" />
          Thank you, your message is on its way
        </p>
        <p className="text-body-m text-muted">
          We’ll reply by email. It can take a few days, so please check your spam folder too.
        </p>
        <button type="button" onClick={onReset} className={`${buttonStyles.secondary} self-start`}>
          Send another message
        </button>
      </div>
    );
  }

  const errors = state.status === "invalid" ? state.errors : {};
  const values = state.status === "invalid" || state.status === "error" ? state.values : undefined;
  const describedBy = (field: ContactField) => (errors[field] ? `${field}-error` : undefined);

  return (
    <form ref={formRef} action={action} noValidate className="flex flex-col gap-3.5">
      <h3 className="text-h3">Send us a message</h3>

      {state.status === "error" && (
        <p role="alert" className="flex items-start gap-2 rounded-2xl bg-tint-coral p-3.5 text-body-s">
          <CircleAlert
            className="mt-0.5 size-5 shrink-0 text-deep-rose"
            strokeWidth={1.75}
            aria-hidden="true"
          />
          <span>
            Sorry, we couldn’t send your message just now. Please try again in a few minutes, or email us at{" "}
            <a href={`mailto:${contact.email}`} className="text-deep-rose underline underline-offset-2">
              {contact.email}
            </a>
            .
          </span>
        </p>
      )}

      <Field id="name" label="Your name" error={errors.name}>
        <input
          id="name"
          name="name"
          type="text"
          autoComplete="name"
          required
          maxLength={LIMITS.name}
          defaultValue={values?.name}
          placeholder="Your name"
          aria-invalid={!!errors.name}
          aria-describedby={describedBy("name")}
          className={`${fieldClass} h-12`}
        />
      </Field>
      <Field id="email" label="Email address" error={errors.email}>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          inputMode="email"
          required
          maxLength={LIMITS.email}
          defaultValue={values?.email}
          placeholder="name@example.com"
          aria-invalid={!!errors.email}
          aria-describedby={describedBy("email")}
          className={`${fieldClass} h-12`}
        />
      </Field>
      <Field id="message" label="Message" error={errors.message}>
        <textarea
          id="message"
          name="message"
          required
          rows={4}
          maxLength={LIMITS.message}
          defaultValue={values?.message}
          placeholder="Write your question here"
          aria-invalid={!!errors.message}
          aria-describedby={describedBy("message")}
          className={`${fieldClass} min-h-28 py-3`}
        />
      </Field>

      {/* Not shown to people; see the server action. */}
      <div className="hidden" aria-hidden="true">
        <label>
          Website
          <input type="text" name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      <section aria-labelledby="privacy-notice" className="rounded-2xl bg-cream p-3.5">
        <h4 id="privacy-notice" className="text-label-m">
          Contact Form Privacy Notice: {contactPrivacy.title}
        </h4>
        {contactPrivacy.paragraphs.map((p) => (
          <p key={p.slice(0, 24)} className="mt-1.5 text-caption text-muted">
            {p}
          </p>
        ))}
        <Link
          href="/privacy#contact-form"
          className="mt-1.5 inline-block text-caption text-deep-rose underline underline-offset-2"
        >
          Privacy and disclaimer
        </Link>
      </section>

      <div className="flex flex-col gap-1.5">
        <label className="flex cursor-pointer items-start gap-3 text-body-m">
          <input
            type="checkbox"
            name="privacy"
            required
            aria-invalid={!!errors.privacy}
            aria-describedby={describedBy("privacy")}
            className="mt-0.5 size-6 shrink-0 cursor-pointer appearance-none rounded-[7px] border-[1.5px] border-muted bg-card bg-center bg-no-repeat checked:border-deep-rose checked:bg-tint-coral checked:bg-[url('/brand/check.svg')] aria-[invalid=true]:border-deep-rose"
          />
          {contactPrivacy.checkboxLabel}
        </label>
        {errors.privacy && <ErrorText id="privacy-error">{errors.privacy}</ErrorText>}
      </div>

      <button
        type="submit"
        disabled={pending}
        className={`${buttonStyles.primary} w-full disabled:opacity-70`}
      >
        {pending ? "Sending…" : "Send message"}
      </button>
      <p className="text-caption text-muted">We’ll reply by email.</p>
    </form>
  );
}

function Field({
  id,
  label,
  error,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-label-m">
        {label}
      </label>
      {children}
      {error && <ErrorText id={`${id}-error`}>{error}</ErrorText>}
    </div>
  );
}

function ErrorText({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <p id={id} className="flex items-center gap-1.5 text-body-s text-deep-rose">
      <CircleAlert className="size-4 shrink-0" strokeWidth={1.75} aria-hidden="true" />
      {children}
    </p>
  );
}
