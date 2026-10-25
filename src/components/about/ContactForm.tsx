"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { CircleCheck } from "lucide-react";
import { useTranslations } from "next-intl";
import { sendContactMessage } from "@/app/[locale]/about/actions";
import { buttonStyles } from "@/components/ui/Button";
import { checkboxClass, ErrorText, Field, FormAlert, fieldClass } from "@/components/ui/Field";
import { contactPrivacy } from "@/content/contactPrivacy";
import { Link } from "@/i18n/navigation";
import { LIMITS, type ContactField, type ContactState } from "@/lib/contact";
import { contact } from "@/lib/nav";

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
  const t = useTranslations("contact");
  const notice = useTranslations("privacyNotice");
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
          {t("sentTitle")}
        </p>
        <p className="text-body-m text-muted">{t("sentText")}</p>
        <button type="button" onClick={onReset} className={`${buttonStyles.secondary} self-start`}>
          {t("sendAnother")}
        </button>
      </div>
    );
  }

  const codes = state.status === "invalid" ? state.errors : {};
  const max = { nameTooLong: LIMITS.name, messageTooLong: LIMITS.message.toLocaleString("en") };
  const errors = Object.fromEntries(
    Object.entries(codes).map(([field, code]) => [
      field,
      t(`errors.${code}`, { max: max[code as keyof typeof max] ?? "" }),
    ]),
  ) as Partial<Record<ContactField, string>>;
  const values = state.status === "invalid" || state.status === "error" ? state.values : undefined;
  const describedBy = (field: ContactField) => (errors[field] ? `${field}-error` : undefined);

  return (
    <form ref={formRef} action={action} noValidate className="flex flex-col gap-3.5">
      <h3 className="text-h3">{t("title")}</h3>

      {state.status === "error" && (
        <FormAlert>
          {t.rich("sendFailed", {
            email: () => (
              <a
                href={`mailto:${contact.email}`}
                className="text-deep-rose underline underline-offset-2"
                dir="ltr"
              >
                {contact.email}
              </a>
            ),
          })}
        </FormAlert>
      )}

      <Field id="name" label={t("name")} error={errors.name}>
        <input
          id="name"
          name="name"
          type="text"
          autoComplete="name"
          required
          maxLength={LIMITS.name}
          defaultValue={values?.name}
          placeholder={t("name")}
          aria-invalid={!!errors.name}
          aria-describedby={describedBy("name")}
          className={`${fieldClass} h-12`}
        />
      </Field>
      <Field id="email" label={t("email")} error={errors.email}>
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
      <Field id="message" label={t("message")} error={errors.message}>
        <textarea
          id="message"
          name="message"
          required
          rows={4}
          maxLength={LIMITS.message}
          defaultValue={values?.message}
          placeholder={t("messagePlaceholder")}
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
          {notice("heading", { title: notice("title") })}
        </h4>
        {contactPrivacy.paragraphs.map((p) => (
          <p key={p} className="mt-1.5 text-caption text-muted">
            {notice(p)}
          </p>
        ))}
        <Link
          href="/privacy#contact-form"
          className="mt-1.5 inline-block text-caption text-deep-rose underline underline-offset-2"
        >
          {t("privacyLink")}
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
            className={`mt-0.5 size-6 rounded-[7px] ${checkboxClass}`}
          />
          {notice("checkbox")}
        </label>
        {errors.privacy && <ErrorText id="privacy-error">{errors.privacy}</ErrorText>}
      </div>

      <button
        type="submit"
        disabled={pending}
        className={`${buttonStyles.primary} w-full disabled:opacity-70`}
      >
        {pending ? t("sending") : t("send")}
      </button>
      <p className="text-caption text-muted">{t("replyByEmail")}</p>
    </form>
  );
}
