/* eslint-disable @next/next/no-img-element -- small static brand SVGs */
import { Award, BookOpen, Compass, Landmark, type LucideIcon } from "lucide-react";
import { LogoMark, LogoStacked } from "@/components/brand/Logo";
import { Container } from "@/components/layout/PageShell";
import { ButtonLink } from "@/components/ui/Button";
import { DottedPath } from "@/components/ui/Blocks";
import { listFields } from "@/lib/data/public";
import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import { alternates } from "@/i18n/metadata";
import { withShare } from "@/i18n/share";
import { pageLocale, type LocaleParams } from "@/i18n/server";
import { countWord } from "@/lib/format";

export const revalidate = 300;

/** Title and description come from the layout. */
export async function generateMetadata({ params }: { params: LocaleParams }): Promise<Metadata> {
  return withShare({ alternates: alternates("/", (await params).locale) }, (await params).locale);
}

export default async function HomePage({ params }: { params: LocaleParams }) {
  const locale = await pageLocale(params);
  const t = await getTranslations("home");
  const fields = await listFields(locale);
  const fieldCount = fields?.length ?? 0;
  const fieldsPhrase = t("fieldsPhrase", { count: fieldCount, word: countWord(fieldCount) });

  const steps: {
    icon: LucideIcon;
    tint: string;
    title: string;
    text: string;
    href: string;
    link: string;
  }[] = [
    {
      icon: Compass,
      tint: "bg-tint-coral",
      title: t("steps.discover.title"),
      text: t("steps.discover.text", { fields: fieldsPhrase }),
      href: "/quiz",
      link: t("steps.discover.link"),
    },
    {
      icon: Landmark,
      tint: "bg-tint-lavender",
      title: t("steps.universities.title"),
      text: t("steps.universities.text"),
      href: "/universities",
      link: t("steps.universities.link"),
    },
    {
      icon: Award,
      tint: "bg-tint-sage",
      title: t("steps.scholarships.title"),
      text: t("steps.scholarships.text"),
      href: "/scholarships",
      link: t("steps.scholarships.link"),
    },
    {
      icon: BookOpen,
      tint: "bg-blush",
      title: t("steps.guide.title"),
      text: t("steps.guide.text"),
      href: "/guide",
      link: t("steps.guide.link"),
    },
  ];

  return (
    <>
      {/* Hero */}
      <Container className="pt-4 pb-2 lg:pt-16 lg:pb-14">
        <div className="flex flex-col gap-4 rounded-[32px] bg-blush px-5 py-6 lg:flex-row lg:items-center lg:gap-16 lg:rounded-none lg:bg-transparent lg:p-0">
          <div className="flex flex-col gap-4 lg:flex-1 lg:gap-5">
            <div className="flex items-center gap-3">
              <p className="flex-1 text-script text-charcoal lg:text-[30px] lg:leading-8 lg:text-deep-rose">
                {t("heroScript")}
              </p>
              <LogoMark className="h-[46.662px] w-[50.4px] lg:hidden" />
            </div>
            <h1 className="text-display">{t("heroTitle")}</h1>
            <p className="text-body-l text-muted">{t("heroText")}</p>
            <div className="flex flex-col gap-2.5 lg:flex-row lg:gap-3 lg:pt-2">
              <ButtonLink href="/quiz" className="w-full lg:w-auto">
                {t("heroStart")}
              </ButtonLink>
              <ButtonLink href="/universities" variant="secondary" className="w-full lg:w-auto">
                {t("heroUniversities")}
              </ButtonLink>
            </div>
          </div>

          <div
            aria-hidden="true"
            className="relative hidden h-[440px] w-[520px] shrink-0 items-center justify-center rounded-[40px] bg-blush lg:flex"
          >
            <LogoStacked />
            <img
              src="/brand/deco-sprig.svg"
              alt=""
              width={80}
              height={120}
              className="absolute start-[410px] top-[290px] block h-[120px] w-20"
            />
            <img
              src="/brand/deco-arcs.svg"
              alt=""
              width={100}
              height={52}
              className="absolute start-9 top-9 block h-[52px] w-[100px]"
            />
          </div>
        </div>
      </Container>

      {/* Path */}
      <Container className="flex flex-col gap-5 pt-8 pb-2 lg:gap-8 lg:py-14">
        <h2 className="text-h2 lg:text-[40px] lg:leading-[46px]">{t("pathTitle")}</h2>
        <ol className="flex flex-col lg:flex-row lg:gap-6">
          {steps.map((step, i) => {
            const last = i === steps.length - 1;
            const Icon = step.icon;
            return (
              <li key={step.title} className="flex gap-3.5 lg:flex-1 lg:flex-col lg:gap-2.5">
                <div className="flex w-12 shrink-0 flex-col items-center gap-1.5 lg:w-full lg:flex-row lg:gap-3">
                  <span
                    className={`flex size-12 shrink-0 items-center justify-center rounded-pill lg:size-14 ${step.tint}`}
                  >
                    <Icon className="size-6 lg:size-[26px]" strokeWidth={1.75} aria-hidden="true" />
                  </span>
                  {!last && (
                    <>
                      <span className="flex flex-1 flex-col items-center pt-0.5 pb-1 lg:hidden">
                        <DottedPath direction="vertical" />
                      </span>
                      <span className="hidden flex-1 items-center pe-1 lg:flex">
                        <DottedPath direction="horizontal" />
                      </span>
                    </>
                  )}
                </div>
                <div
                  className={`flex min-w-0 flex-1 flex-col gap-1 pt-0.5 lg:flex-none lg:pt-0 ${last ? "" : "pb-[22px] lg:pb-0"}`}
                >
                  <p className="text-label-s text-muted">{t("step", { number: i + 1 })}</p>
                  <h3 className="text-h3">{step.title}</h3>
                  <p className="text-body-s text-muted lg:text-body-m">{step.text}</p>
                  <ButtonLink href={step.href} variant="text">
                    {step.link}
                  </ButtonLink>
                </div>
              </li>
            );
          })}
        </ol>
      </Container>

      {/* Why Humraah */}
      <Container className="flex flex-col gap-3 py-9 lg:flex-row lg:gap-16 lg:pt-14 lg:pb-[72px]">
        <div className="flex flex-col gap-3 lg:w-[520px] lg:shrink-0 lg:gap-4">
          <img
            src="/brand/deco-heart-divider.svg"
            alt=""
            width={240}
            height={16}
            className="block h-4 w-60"
          />
          <h2 className="text-h2 lg:text-[40px] lg:leading-[46px]">{t("whyTitle")}</h2>
        </div>
        <div className="flex flex-col items-start gap-3 lg:flex-1 lg:gap-4">
          <p className="text-body-m text-muted lg:text-body-l">
            <span className="lg:hidden">{t("whyTextShort")}</span>
            <span className="hidden lg:inline">{t("whyTextLong")}</span>
          </p>
          <ButtonLink href="/about" variant="text">
            {t("aboutLink")}
          </ButtonLink>
        </div>
      </Container>
    </>
  );
}
