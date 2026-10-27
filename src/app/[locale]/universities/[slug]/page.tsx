import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { useTranslations } from "next-intl";
import { getTranslations } from "next-intl/server";
import {
  Award,
  Calendar,
  ChevronRight,
  CircleAlert,
  FileText,
  Globe,
  GraduationCap,
  ListChecks,
  MapPin,
  Pencil,
  ShieldCheck,
  ExternalLink,
  type LucideIcon,
} from "lucide-react";
import { UniversityAvatar } from "@/components/content/Cards";
import { Container } from "@/components/layout/PageShell";
import { Accordion, ImportantCallout, NextSteps, StaleNotice, Step } from "@/components/ui/Blocks";
import { ButtonLink } from "@/components/ui/Button";
import { Chip, HecBadge, SourceBadge, VerificationBadge } from "@/components/ui/Chip";
import { EnglishNote, englishAttrs } from "@/components/ui/InEnglish";
import { ShareButton } from "@/components/ui/ShareButton";
import { getUniversity, listFields, listUniversitySlugs, type ProgrammeSummary } from "@/lib/data/public";
import { formatFeeRange, formatLongDate, stepsFrom } from "@/lib/format";
import { contact } from "@/lib/nav";
import { Link } from "@/i18n/navigation";
import { toLocale } from "@/i18n/config";
import { alternates } from "@/i18n/metadata";
import { pageLocale, type LocaleParams } from "@/i18n/server";

type Props = { params: LocaleParams<{ slug: string }> };

export const revalidate = 300;

export async function generateStaticParams() {
  return (await listUniversitySlugs()).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, locale } = await params;
  const university = await getUniversity(slug, toLocale(locale));
  const t = await getTranslations({ locale, namespace: "university" });
  if (!university) return { title: t("metaTitle") };
  return {
    title: university.name,
    description: university.overview ?? undefined,
    alternates: alternates(`/universities/${slug}`, locale),
  };
}

/** Typical steps from Figma, shown until a researcher writes this university's own ("university.typicalSteps"). */
const typicalSteps = ["eligible", "register", "form", "fee", "test"] as const;

export default async function UniversityPage({ params }: Props) {
  const locale = await pageLocale(params);
  const t = await getTranslations("university");
  const common = await getTranslations("common");
  const { slug } = await params;
  const [university, fields] = await Promise.all([getUniversity(slug, locale), listFields(locale)]);
  if (university === null) {
    return (
      <Container className="py-12">
        <p className="rounded-2xl bg-tint-lavender p-5 text-body-m" role="status">
          {t("notConnected")}
        </p>
      </Container>
    );
  }
  if (!university) notFound();
  const u = university;

  const fee = formatFeeRange(u.fee_min_pkr, u.fee_max_pkr, (min, max) => t("feeRange", { min, max }));
  const TBC = t("toBeConfirmed");
  const location = u.campuses_note ?? u.city;
  const ownSteps = stepsFrom(u.how_to_apply);
  const tests = [
    ...new Set(
      [u.admission_test, ...u.programmes.map((p) => p.entryTest)].filter((test): test is string => !!test),
    ),
  ];
  const requirements = u.programmes.filter((p) => p.entryRequirements);

  // Programmes grouped by field, in the order the fields are listed.
  const fieldList = fields ?? [];
  const groups = [
    ...fieldList.map((f) => ({
      key: f.id,
      name: f.name,
      slug: f.slug as string | null,
      items: u.programmes.filter((p) => p.fieldId === f.id),
    })),
    {
      key: "other",
      name: t("otherProgrammes"),
      slug: null,
      items: u.programmes.filter((p) => !p.fieldId || !fieldList.some((f) => f.id === p.fieldId)),
    },
  ].filter((g) => g.items.length > 0);

  const dateTbc = t("datesToBeConfirmed");

  return (
    <>
      <Container className="pt-5 lg:pt-4">
        <nav aria-label={common("breadcrumb")} className="hidden items-center gap-1.5 text-body-s lg:flex">
          <Link
            href="/universities"
            className="py-2.5 text-label-m text-deep-rose underline underline-offset-2 hover:text-charcoal"
          >
            {t("breadcrumb")}
          </Link>
          <ChevronRight className="size-4" strokeWidth={1.75} aria-hidden="true" />
          <span aria-current="page" className="text-muted">
            {u.name}
          </span>
        </nav>

        <header className="flex flex-col gap-3 lg:grid lg:grid-cols-[minmax(0,1fr)_380px] lg:grid-rows-[auto_1fr] lg:gap-x-12 lg:gap-y-3.5 lg:pt-4 lg:pb-10">
          <div className="flex flex-col gap-3 lg:col-start-1 lg:row-start-1 lg:gap-3.5">
            <div className="flex items-center gap-3 lg:gap-3.5">
              <UniversityAvatar slug={u.slug} name={u.name} shortName={u.short_name} size="lg" />
              {u.hec_recognised && <HecBadge />}
            </div>
            <h1
              className="text-h1 lg:text-[60px] lg:leading-[64px] lg:tracking-[-0.9px]"
              lang={u.name_ur ? undefined : "en"}
            >
              {u.name}
            </h1>
            <div className="flex flex-wrap items-center gap-x-2.5 gap-y-2">
              <span className="flex items-center gap-1 text-body-s text-muted lg:text-body-m">
                <MapPin className="size-4" strokeWidth={1.75} aria-hidden="true" />
                <span {...(u.campuses_note ? englishAttrs(u, "campuses_note") : { lang: "en" })}>
                  {location}
                </span>
              </span>
              {u.type && <Chip tone="lavender">{t(u.type)}</Chip>}
              {u.women_only && <Chip tone="coral">{t("womenOnly")}</Chip>}
            </div>
            <p
              className="text-body-m text-muted lg:max-w-[680px] lg:text-body-l"
              {...englishAttrs(u, "overview")}
            >
              {u.overview ?? t("noOverview")}
            </p>
            <EnglishNote row={u} fields={["overview"]} />
          </div>

          <div className="order-1 flex flex-col gap-2.5 pt-1 lg:order-none lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:gap-3 lg:rounded-3xl lg:border lg:border-border-soft lg:bg-card lg:p-6 lg:pt-6">
            {u.website_url ? (
              <ButtonLink href={u.website_url} external className="w-full">
                {t("visitWebsite")}
              </ButtonLink>
            ) : (
              <p className="rounded-2xl bg-tint-lavender p-3.5 text-center text-body-s">{t("noWebsite")}</p>
            )}
            <ShareButton variant="whatsapp" title={t("shareTitle", { name: u.name })} className="w-full" />
            <div className="hidden flex-col gap-3 lg:flex">
              <span className="h-px bg-border-soft" aria-hidden="true" />
              <FactRow icon={FileText} label={t("factFees")} value={fee ?? TBC} />
              <FactRow icon={Pencil} label={t("factTest")} value={u.admission_test ?? TBC} />
              <FactRow icon={Calendar} label={t("factApplications")} value={u.admissions_window ?? dateTbc} />
            </div>
          </div>

          <div className="order-2 grid grid-cols-3 gap-2.5 pt-1 lg:hidden">
            <FactTile icon={FileText} label={t("factFees")} value={fee ?? TBC} />
            <FactTile icon={Pencil} label={t("factTest")} value={u.admission_test ?? TBC} />
            <FactTile icon={Calendar} label={t("factApplications")} value={u.admissions_window ?? dateTbc} />
          </div>

          <div className="order-3 flex flex-wrap items-center gap-2 pt-1 lg:order-none lg:col-start-1 lg:row-start-2 lg:gap-2.5 lg:self-start lg:pt-1">
            <VerificationBadge verifiedAt={u.last_verified_at} />
            {u.last_verified_at && (
              <p className="text-caption text-muted">
                {t("lastVerified", { date: formatLongDate(u.last_verified_at, locale) })}
              </p>
            )}
            {u.source_url && <SourceBadge url={u.source_url} />}
            <StaleNotice verifiedAt={u.last_verified_at} className="mt-1 basis-full" />
          </div>
        </header>
      </Container>

      <Container className="flex flex-col gap-5 pt-7 pb-6 lg:grid lg:grid-cols-[minmax(0,1fr)_380px] lg:items-start lg:gap-x-12 lg:pt-2 lg:pb-16">
        <section aria-labelledby="apply-heading" className="flex flex-col gap-2.5 lg:gap-3">
          <h2 id="apply-heading" className="text-h2">
            {t("applyTitle")}
          </h2>

          <Accordion icon={GraduationCap} title={t("programmes")} defaultOpen>
            {groups.length === 0 ? (
              <p className="border-t border-border-soft pt-3 text-body-s text-muted">{t("noProgrammes")}</p>
            ) : (
              <ul className="flex flex-col gap-3 lg:grid lg:grid-cols-3">
                {groups.map((g) => (
                  <li key={g.key}>
                    <GroupRow name={g.name} slug={g.slug} items={g.items} />
                  </li>
                ))}
              </ul>
            )}
            <p className="text-caption text-muted">{t("programmesNote")}</p>
          </Accordion>

          <Accordion icon={ListChecks} title={t("howToApply")} defaultOpen>
            {ownSteps.length >= 2 ? (
              <>
                <p className="text-body-s text-muted">{t("confirmSteps")}</p>
                <ol {...englishAttrs(u, "how_to_apply")}>
                  {ownSteps.map((text, i) => (
                    <Step key={text} number={i + 1} title={text} last={i === ownSteps.length - 1} />
                  ))}
                </ol>
                <EnglishNote row={u} fields={["how_to_apply"]} />
              </>
            ) : ownSteps.length === 1 ? (
              <>
                <p className="text-body-m" {...englishAttrs(u, "how_to_apply")}>
                  {ownSteps[0]}
                </p>
                <EnglishNote row={u} fields={["how_to_apply"]} />
              </>
            ) : (
              <>
                <p className="text-body-s text-muted">{t("typicalStepsIntro")}</p>
                <ol>
                  {typicalSteps.map((step, i) => (
                    <Step
                      key={step}
                      number={i + 1}
                      title={t(`typicalSteps.${step}.title`)}
                      last={i === typicalSteps.length - 1}
                    >
                      {t(`typicalSteps.${step}.text`)}
                    </Step>
                  ))}
                </ol>
              </>
            )}
          </Accordion>

          <Accordion icon={ShieldCheck} title={t("requirements")}>
            {requirements.length > 0 ? (
              <ul className="flex flex-col gap-2.5">
                {requirements.map((p) => (
                  <RequirementRow key={`${p.name}-${p.level}`} programme={p} />
                ))}
              </ul>
            ) : (
              <p className="text-body-s text-muted">{t("noRequirements")}</p>
            )}
          </Accordion>

          <Accordion icon={FileText} title={t("fees")}>
            {fee || u.fee_note ? (
              <>
                {fee && <p className="text-body-m">{fee}</p>}
                {u.fee_note && (
                  <p className="text-body-s text-muted" {...englishAttrs(u, "fee_note")}>
                    {u.fee_note}
                  </p>
                )}
              </>
            ) : (
              <p className="text-body-s text-muted">{t("noFees")}</p>
            )}
          </Accordion>

          <Accordion icon={Award} title={t("aid")}>
            <p className="text-body-m">
              {u.need_based_aid === true
                ? t("aidYes")
                : u.need_based_aid === false
                  ? t("aidNo")
                  : t("aidUnknown")}
            </p>
            <Link
              href="/scholarships"
              className="self-start py-2.5 text-label-m text-deep-rose underline underline-offset-2 hover:text-charcoal"
            >
              {t("browseScholarships")}
            </Link>
          </Accordion>

          <Accordion icon={Calendar} title={t("dates")}>
            <p className="text-body-m" {...englishAttrs(u, "admissions_window")}>
              {u.admissions_window ?? t("noDates")}
            </p>
          </Accordion>

          <Accordion icon={Pencil} title={t("testsDocuments")}>
            <div className="flex flex-col gap-1.5">
              <h3 className="text-label-m">{t("tests")}</h3>
              {tests.length > 0 ? (
                <ul
                  className="list-disc ps-5 text-body-m marker:text-muted"
                  lang={
                    englishAttrs(u, "admission_test").lang ??
                    (u.programmes.some((p) => p.english.includes("entryTest")) ? "en" : undefined)
                  }
                >
                  {tests.map((test) => (
                    <li key={test}>{test}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-body-s text-muted">{t("noTests")}</p>
              )}
            </div>
            <div className="flex flex-col gap-1.5">
              <h3 className="text-label-m">{t("documents")}</h3>
              {u.required_documents.length > 0 ? (
                <ul
                  className="list-disc ps-5 text-body-m marker:text-muted"
                  {...englishAttrs(u, "required_documents")}
                >
                  {u.required_documents.map((d) => (
                    <li key={d}>{d}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-body-s text-muted">{t("noDocuments")}</p>
              )}
            </div>
          </Accordion>

          <Accordion icon={Globe} title={t("international")}>
            <p className="text-body-s text-muted">{t("noInternational")}</p>
          </Accordion>

          <Accordion icon={ExternalLink} title={t("links")}>
            {u.website_url || u.admissions_url || u.source_url ? (
              <ul className="flex flex-col">
                {[
                  { label: t("linkWebsite"), url: u.website_url },
                  { label: t("linkAdmissions"), url: u.admissions_url },
                  { label: t("linkSource"), url: u.source_url },
                ]
                  .filter((l): l is { label: string; url: string } => !!l.url)
                  .map((l) => (
                    <li key={l.label}>
                      <ButtonLink href={l.url} variant="text" external>
                        {l.label}
                      </ButtonLink>
                    </li>
                  ))}
              </ul>
            ) : (
              <p className="text-body-s text-muted">{t("noLinks")}</p>
            )}
          </Accordion>
        </section>

        <aside className="flex flex-col gap-4">
          <NextSteps
            items={[t("nextSteps.dates"), t("nextSteps.requirements"), t("nextSteps.scholarship")]}
            action={{ href: "/scholarships", label: t("nextSteps.action") }}
          />
          <ImportantCallout title={t("beforeTitle")} className="hidden lg:block">
            {t("beforeText")}
          </ImportantCallout>
          <p className="flex flex-wrap items-center gap-x-2 text-body-s text-muted lg:p-1">
            <CircleAlert className="size-[18px]" strokeWidth={1.75} aria-hidden="true" />
            {t("outdated")}
            <a
              href={`mailto:${contact.email}?subject=${encodeURIComponent(`Update needed: ${u.name}`)}`}
              className="py-2.5 text-label-m text-deep-rose underline underline-offset-2 hover:text-charcoal"
            >
              {t("tellUs")}
            </a>
          </p>
        </aside>
      </Container>

      {u.website_url && (
        <div className="sticky bottom-[83px] z-20 border-t border-border-soft bg-card px-5 pt-3 pb-4 shadow-bottom-bar lg:hidden">
          <ButtonLink href={u.website_url} external className="w-full">
            {t("visitWebsite")}
          </ButtonLink>
        </div>
      )}
    </>
  );
}

function FactTile({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string }) {
  return (
    <div className="flex min-w-0 flex-col gap-1.5 rounded-2xl border border-border-soft bg-card p-3">
      <Icon className="size-5" strokeWidth={1.75} aria-hidden="true" />
      <p className="text-caption text-muted">{label}</p>
      <p className="text-label-m break-words">{value}</p>
    </div>
  );
}

function FactRow({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 py-1">
      <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-tint-coral">
        <Icon className="size-5" strokeWidth={1.75} aria-hidden="true" />
      </span>
      <div className="min-w-0">
        <p className="text-caption text-muted">{label}</p>
        <p className="text-label-m">{value}</p>
      </div>
    </div>
  );
}

function GroupRow({ name, slug, items }: { name: string; slug: string | null; items: ProgrammeSummary[] }) {
  const t = useTranslations("cards");
  const body = (
    <>
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="text-label-m">{name}</span>
        <span className="text-body-s text-muted">{t("programmes", { count: items.length })}</span>
        <span className="text-caption text-muted">{items.map((p) => p.name).join(", ")}</span>
      </span>
      {slug && <ChevronRight className="size-[18px] shrink-0" strokeWidth={1.75} aria-hidden="true" />}
    </>
  );
  const classes =
    "flex items-center gap-2.5 border-t border-border-soft pt-3 lg:h-full lg:rounded-[14px] lg:border-0 lg:bg-cream lg:p-3.5";
  return slug ? (
    <Link href={`/explore/${slug}`} className={`${classes} hover:bg-blush/40`}>
      {body}
    </Link>
  ) : (
    <div className={classes}>{body}</div>
  );
}

function RequirementRow({ programme: p }: { programme: ProgrammeSummary }) {
  return (
    <li className="flex flex-col gap-0.5 border-t border-border-soft pt-2.5 first:border-0 first:pt-0">
      <span className="text-label-m" lang="en">
        {p.name}
      </span>
      <span
        className="text-body-s text-muted"
        {...(p.english.includes("entryRequirements") ? { lang: "en", dir: "ltr" as const } : {})}
      >
        {p.entryRequirements}
      </span>
    </li>
  );
}
