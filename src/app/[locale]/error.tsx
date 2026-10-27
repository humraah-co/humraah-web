"use client";

import { useTranslations } from "next-intl";
import { Container } from "@/components/layout/PageShell";
import { ButtonLink, buttonStyles } from "@/components/ui/Button";

/**
 * Shown when a public page fails while it is being built or loaded: a
 * friendly message in the page's language, a way to retry and a way home.
 * Deliberately shows nothing about the error itself (no message, no code);
 * Next.js records the details on the server.
 */
export default function PublicError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const t = useTranslations("serverError");
  return (
    <Container className="py-16 text-center lg:py-24">
      <p className="text-script text-deep-rose">{t("script")}</p>
      <h1 className="mt-3 text-h1">{t("title")}</h1>
      <p className="mx-auto mt-3 max-w-md text-body-m text-muted">{t("text")}</p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <button type="button" onClick={reset} className={buttonStyles.primary}>
          {t("tryAgain")}
        </button>
        <ButtonLink href="/" variant="secondary">
          {t("home")}
        </ButtonLink>
      </div>
    </Container>
  );
}
