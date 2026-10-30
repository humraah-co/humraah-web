import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { ScholarshipCard, UniversityCard } from "@/components/content/Cards";
import { FieldIcon } from "@/components/content/FieldIcon";
import { Container } from "@/components/layout/PageShell";
import { EnglishNote, englishAttrs } from "@/components/ui/InEnglish";
import { NextSteps, RememberCallout, SectionHeader, StaleNotice } from "@/components/ui/Blocks";
import { Chip, ChipList } from "@/components/ui/Chip";
import { getField, listFields, listScholarshipCards, listUniversityCards } from "@/lib/data/public";
import { Link } from "@/i18n/navigation";
import { toLocale } from "@/i18n/config";
import { alternates } from "@/i18n/metadata";
import { withShare } from "@/i18n/share";
import { pageLocale, type LocaleParams } from "@/i18n/server";

type Props = { params: LocaleParams<{ slug: string }> };

export const revalidate = 300;

export async function generateStaticParams() {
  const fields = await listFields();
  return fields?.map((f) => ({ slug: f.slug })) ?? [];
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, locale } = await params;
  const field = await getField(slug, toLocale(locale));
  const t = await getTranslations({ locale, namespace: "field" });
  if (!field) return { title: t("metaTitle") };
  return withShare(
    {
      title: field.name,
      description: field.summary ?? undefined,
      alternates: alternates(`/explore/${slug}`, locale),
    },
    locale,
  );
}

export default async function FieldPage({ params }: Props) {
  const locale = await pageLocale(params);
  const t = await getTranslations("field");
  const common = await getTranslations("common");
  const { slug } = await params;
  const field = await getField(slug, locale);
  if (field === null) {
    return (
      <Container className="py-12">
        <p className="rounded-2xl bg-tint-lavender p-5 text-body-m" role="status">
          {t("notConnected")}
        </p>
      </Container>
    );
  }
  if (!field) notFound();

  const [universities, scholarships] = await Promise.all([
    listUniversityCards(locale),
    listScholarshipCards(locale),
  ]);

  const offering = (universities ?? []).filter((u) => u.fieldIds.includes(field.id));
  // Scholarships tied to this field first, then ones open to any field.
  const relevant = [
    ...(scholarships ?? []).filter((s) => s.fieldIds.includes(field.id)),
    ...(scholarships ?? []).filter((s) => s.fieldIds.length === 0),
  ];

  const universitiesHref = `/universities?field=${field.slug}`;

  return (
    <Container className="pt-5 pb-7 lg:pt-4 lg:pb-16">
      <nav aria-label={common("breadcrumb")} className="hidden items-center gap-1.5 text-body-s lg:flex">
        <Link
          href="/explore"
          className="py-2.5 text-label-m text-deep-rose underline underline-offset-2 hover:text-charcoal"
        >
          {t("breadcrumb")}
        </Link>
        <ChevronRight className="size-4" strokeWidth={1.75} aria-hidden="true" />
        <span aria-current="page" className="text-muted">
          {field.name}
        </span>
      </nav>

      <div className="flex flex-col lg:grid lg:grid-cols-[minmax(0,1fr)_380px] lg:gap-x-12 lg:gap-y-0 lg:pt-1">
        <header className="flex flex-col gap-3 lg:col-start-1 lg:row-start-1 lg:gap-4 lg:pb-10">
          <FieldIcon slug={field.slug} size="lg" />
          <h1
            className="text-h1 lg:text-[60px] lg:leading-[64px] lg:tracking-[-0.9px]"
            {...englishAttrs(field, "name")}
          >
            {field.name}
          </h1>
          <p
            className="text-body-m text-muted lg:max-w-[680px] lg:text-body-l"
            {...englishAttrs(field, "summary")}
          >
            {field.summary ?? t("noSummary")}
          </p>
          <EnglishNote row={field} fields={["summary"]} />
          <StaleNotice verifiedAt={field.last_verified_at} className="lg:max-w-[680px]" />

          <div className="mt-2 flex flex-col gap-2.5 lg:mt-0">
            <h2 className="text-label-l">{t("enjoyTitle")}</h2>
            {field.interests.length > 0 ? (
              <ChipList className="gap-2">
                {field.interests.map((interest) => (
                  <Chip key={interest} tone="sage" {...englishAttrs(field, "interests")}>
                    {interest}
                  </Chip>
                ))}
              </ChipList>
            ) : (
              <p className="text-body-s text-muted">{t("toBeConfirmed")}</p>
            )}
          </div>

          <div className="flex flex-col gap-2.5">
            <h2 className="text-label-l">{t("programmesTitle")}</h2>
            {field.example_programmes.length > 0 ? (
              <ChipList className="gap-2">
                {field.example_programmes.map((programme) => (
                  <Chip key={programme} lang="en">
                    {programme}
                  </Chip>
                ))}
              </ChipList>
            ) : (
              <p className="text-body-s text-muted">{t("toBeConfirmed")}</p>
            )}
          </div>
        </header>

        <div className="contents lg:col-start-2 lg:row-start-1 lg:flex lg:flex-col lg:gap-4">
          <RememberCallout className="order-1 mt-5 lg:order-2 lg:mt-0">{t("remember")}</RememberCallout>
          <NextSteps
            className="order-4 mt-7 lg:order-1 lg:mt-0"
            items={[t("nextSteps.compare"), t("nextSteps.requirements"), t("nextSteps.scholarship")]}
            action={{ href: universitiesHref, label: t("nextSteps.action") }}
          />
        </div>

        <section
          aria-labelledby="universities-heading"
          className="order-2 mt-7 flex flex-col gap-3 lg:col-span-2 lg:mt-0 lg:gap-4"
        >
          <SectionHeader
            title={<span id="universities-heading">{t("universitiesTitle")}</span>}
            href={universitiesHref}
            linkLabel={
              <>
                <span className="lg:hidden">{t("seeAll")}</span>
                <span className="hidden lg:inline">{t("seeAllUniversities")}</span>
              </>
            }
          />
          {universities === null ? (
            <p className="rounded-2xl bg-tint-lavender p-5 text-body-m" role="status">
              {t("universitiesNotConnected")}
            </p>
          ) : offering.length === 0 ? (
            <p className="rounded-2xl bg-blush p-5 text-body-m">
              {t("noUniversities")}{" "}
              <Link
                href="/universities"
                className="text-deep-rose underline underline-offset-2 hover:text-charcoal"
              >
                {t("browseUniversities")}
              </Link>
            </p>
          ) : (
            <ul className="grid grid-cols-1 gap-3.5 lg:grid-cols-3 lg:gap-6">
              {offering.slice(0, 3).map((u, i) => (
                <li key={u.id} className={`flex-col *:flex-1 ${i === 2 ? "hidden lg:flex" : "flex"}`}>
                  <UniversityCard university={u} fieldId={field.id} />
                </li>
              ))}
            </ul>
          )}
        </section>

        <section
          aria-labelledby="scholarships-heading"
          className="order-3 mt-7 flex flex-col gap-3 lg:col-span-2 lg:mt-12 lg:gap-4"
        >
          <SectionHeader
            title={<span id="scholarships-heading">{t("scholarshipsTitle")}</span>}
            href="/scholarships"
            linkLabel={
              <>
                <span className="lg:hidden">{t("seeAll")}</span>
                <span className="hidden lg:inline">{t("seeAllScholarships")}</span>
              </>
            }
          />
          {scholarships === null ? (
            <p className="rounded-2xl bg-tint-lavender p-5 text-body-m" role="status">
              {t("scholarshipsNotConnected")}
            </p>
          ) : relevant.length === 0 ? (
            <p className="rounded-2xl bg-blush p-5 text-body-m">
              {t("noScholarships")}{" "}
              <Link
                href="/scholarships"
                className="text-deep-rose underline underline-offset-2 hover:text-charcoal"
              >
                {t("browseScholarships")}
              </Link>
            </p>
          ) : (
            <ul className="grid grid-cols-1 gap-3.5 lg:grid-cols-3 lg:gap-6">
              {relevant.slice(0, 3).map((s, i) => (
                <li key={s.id} className={`flex-col *:flex-1 ${i === 2 ? "hidden lg:flex" : "flex"}`}>
                  <ScholarshipCard scholarship={s} />
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </Container>
  );
}
