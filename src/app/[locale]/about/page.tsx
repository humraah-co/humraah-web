import type { Metadata } from "next";
import { AtSign, BookOpen, Compass, Mail, Sprout, Users, type LucideIcon } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { ContactForm } from "@/components/about/ContactForm";
import { LogoStacked } from "@/components/brand/Logo";
import { Container } from "@/components/layout/PageShell";
import { HelpCallout } from "@/components/ui/Blocks";
import { Ltr } from "@/components/ui/Ltr";
import { contact } from "@/lib/nav";
import { alternates } from "@/i18n/metadata";
import { withShare } from "@/i18n/share";
import { pageLocale, type LocaleParams } from "@/i18n/server";

export async function generateMetadata({ params }: { params: LocaleParams }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "about" });
  return withShare(
    {
      title: t("metaTitle"),
      description: t("metaDescription"),
      alternates: alternates("/about", locale),
    },
    locale,
  );
}

/** Text for each is in "about.story" and "about.values". */
const story = [
  { key: "name", tint: "bg-tint-lavender" },
  { key: "problem", tint: "bg-blush" },
  { key: "work", tint: "bg-tint-sage" },
] as const;

const values: { key: "knowledge" | "access" | "community" | "confidence"; icon: LucideIcon; tint: string }[] =
  [
    { key: "knowledge", icon: BookOpen, tint: "bg-tint-coral" },
    { key: "access", icon: Compass, tint: "bg-tint-sage" },
    { key: "community", icon: Users, tint: "bg-tint-lavender" },
    { key: "confidence", icon: Sprout, tint: "bg-blush" },
  ];

export default async function AboutPage({ params }: { params: LocaleParams }) {
  await pageLocale(params);
  const t = await getTranslations("about");
  return (
    <>
      {/* Hero: a centred blush panel on phones (30:2442), text beside the logo panel on desktop (33:3140). */}
      <Container className="px-4 pt-4 pb-2 lg:px-20 lg:pt-14 lg:pb-0">
        <div className="flex flex-col items-center gap-3.5 rounded-[32px] bg-blush px-5 pt-8 pb-7 text-center lg:grid lg:grid-cols-[minmax(0,1fr)_442px] lg:items-center lg:gap-16 lg:rounded-none lg:bg-transparent lg:p-0 lg:text-start">
          <div className="order-2 flex flex-col gap-3.5 lg:order-1 lg:gap-4">
            <p className="text-script text-charcoal lg:text-[28px] lg:leading-[32px] lg:text-deep-rose">
              {t("tagline")}
            </p>
            <h1 className="sr-only lg:not-sr-only lg:font-serif lg:text-[56px] lg:leading-[60px] lg:font-semibold lg:tracking-[-0.8px]">
              {t("title")}
            </h1>
            <p className="text-body-m text-muted lg:max-w-[600px] lg:text-body-l">{t("intro")}</p>
          </div>
          <div className="order-1 lg:order-2 lg:flex lg:h-[341px] lg:items-center lg:justify-center lg:rounded-[40px] lg:bg-blush">
            <LogoStacked size="about" />
          </div>
        </div>
      </Container>

      <Container className="flex flex-col gap-3 pt-6 pb-2 lg:grid lg:grid-cols-3 lg:gap-6 lg:pt-14">
        {story.map((s) => (
          <section key={s.key} className={`flex flex-col gap-2 rounded-3xl p-5 lg:p-6 ${s.tint}`}>
            <h2 className="text-h3">{t(`story.${s.key}.title`)}</h2>
            <p className="text-body-m">{t(`story.${s.key}.text`)}</p>
          </section>
        ))}
      </Container>

      <Container className="flex flex-col gap-1.5 pt-5 pb-2 lg:hidden">
        <p className="text-label-s text-muted">{t("promiseLabel")}</p>
        <p className="font-script text-[30px] leading-[32px] text-deep-rose">{t("promise")}</p>
      </Container>

      <Container className="pt-5 pb-2 lg:pt-14">
        <h2 className="text-h2 lg:text-[40px] lg:leading-[46px]">{t("valuesTitle")}</h2>
        <ul className="mt-3.5 grid grid-cols-2 gap-4 lg:mt-6 lg:grid-cols-4 lg:gap-6">
          {values.map(({ key, icon: Icon, tint }) => (
            <li key={key} className={`flex flex-col gap-2.5 rounded-[22px] p-4 lg:p-5 ${tint}`}>
              <span className="flex size-11 items-center justify-center rounded-pill bg-card">
                <Icon className="size-[22px]" strokeWidth={1.75} aria-hidden="true" />
              </span>
              <span className="text-label-l">{t(`values.${key}.title`)}</span>
              <span className="text-body-s">{t(`values.${key}.text`)}</span>
            </li>
          ))}
        </ul>
      </Container>

      <Container className="flex flex-col gap-3.5 pt-7 pb-7 lg:grid lg:grid-cols-[minmax(0,1fr)_520px] lg:items-start lg:gap-x-16 lg:pt-16 lg:pb-16">
        <section aria-labelledby="contact-heading" className="flex flex-col gap-3.5 lg:gap-5">
          <h2 id="contact-heading" className="text-h2 lg:text-[40px] lg:leading-[46px]">
            {t("contactTitle")}
          </h2>
          <HelpCallout />
          <ul className="flex flex-col gap-2.5 text-body-m">
            <li className="flex items-center gap-2.5">
              <AtSign className="size-5 shrink-0" strokeWidth={1.75} aria-hidden="true" />
              <a href={contact.instagramUrl} rel="noopener" className="hover:text-deep-rose">
                {t.rich("instagram", { handle: () => <Ltr>{contact.instagramHandle}</Ltr> })}
              </a>
            </li>
            <li className="flex items-center gap-2.5">
              <Users className="size-5 shrink-0" strokeWidth={1.75} aria-hidden="true" />
              <span>{t.rich("linkedin", { name: () => <Ltr>{contact.linkedinLabel}</Ltr> })}</span>
            </li>
            <li className="flex items-center gap-2.5">
              <Mail className="size-5 shrink-0" strokeWidth={1.75} aria-hidden="true" />
              <a href={`mailto:${contact.email}`} className="hover:text-deep-rose" lang="en" dir="ltr">
                {contact.email}
              </a>
            </li>
          </ul>
        </section>

        <div className="rounded-3xl border border-border-soft bg-card p-5 lg:p-6">
          <ContactForm />
        </div>
      </Container>
    </>
  );
}
