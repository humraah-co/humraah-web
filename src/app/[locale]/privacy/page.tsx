import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Container } from "@/components/layout/PageShell";
import { contactPrivacy } from "@/content/contactPrivacy";
import { contact } from "@/lib/nav";
import { pageLocale, type LocaleParams } from "@/i18n/server";

export async function generateMetadata({ params }: { params: LocaleParams }): Promise<Metadata> {
  const t = await getTranslations({ locale: (await params).locale, namespace: "privacy" });
  return { title: t("title"), description: t("metaDescription") };
}

/*
 * PRIVACY WORDING: AWAITING APPROVAL.
 * The disclaimer is a short standard one written for the site. The Contact
 * Form Privacy Notice is the content pack's draft wording (see
 * src/content/contactPrivacy.ts for its status and what the site does
 * today). Neither has been approved by Humraah yet; update both before
 * launch.
 */
export default async function PrivacyPage({ params }: { params: LocaleParams }) {
  await pageLocale(params);
  const t = await getTranslations("privacy");
  const notice = await getTranslations("privacyNotice");
  const link = "text-deep-rose underline underline-offset-2 hover:text-charcoal";
  return (
    <Container className="pt-6 pb-10 lg:pt-12 lg:pb-16">
      <div className="flex max-w-[720px] flex-col gap-8">
        <header className="flex flex-col gap-3">
          <h1 className="text-h1 lg:text-[40px] lg:leading-[46px]">{t("title")}</h1>
        </header>

        <section aria-labelledby="disclaimer" className="flex flex-col gap-3">
          <h2 id="disclaimer" className="text-h2">
            {t("disclaimer")}
          </h2>
          <p className="text-body-m">{t("disclaimerP1")}</p>
          <p className="text-body-m">{t("disclaimerP2")}</p>
          <p className="text-body-m">
            {t.rich("disclaimerP3", {
              email: () => (
                <a href={`mailto:${contact.email}`} className={link}>
                  {contact.email}
                </a>
              ),
            })}
          </p>
        </section>

        <section
          id="contact-form"
          aria-labelledby="contact-form-heading"
          className="flex scroll-mt-28 flex-col gap-3"
        >
          <h2 id="contact-form-heading" className="text-h2">
            {t("noticeTitle")}
          </h2>
          <h3 className="text-h3">{notice("title")}</h3>
          {contactPrivacy.paragraphs.map((p) => (
            <p key={p} className="text-body-m">
              {notice(p)}
            </p>
          ))}
        </section>
      </div>
    </Container>
  );
}
