import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Check, ChevronRight, CircleAlert, Clock } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { getTranslations } from "next-intl/server";
import { deadlineLabel, ScholarshipCard } from "@/components/content/Cards";
import { Container } from "@/components/layout/PageShell";
import { ImportantCallout, NextSteps, StaleNotice, Step } from "@/components/ui/Blocks";
import { ButtonLink } from "@/components/ui/Button";
import { Chip, ChipList, SourceBadge, VerificationBadge } from "@/components/ui/Chip";
import { ShareButton } from "@/components/ui/ShareButton";
import { getScholarship, listScholarshipCards, type ScholarshipCard as CardData } from "@/lib/data/public";
import { daysUntil, formatLongDate, pointsFrom, stepsFrom } from "@/lib/format";
import { contact } from "@/lib/nav";
import { isForWomen } from "@/lib/scholarshipFilters";
import type { Locale } from "@/i18n/config";
import { Link } from "@/i18n/navigation";
import { pageLocale, type LocaleParams } from "@/i18n/server";

type Props = { params: LocaleParams<{ slug: string }> };

export const revalidate = 300;

export async function generateStaticParams() {
  return ((await listScholarshipCards()) ?? []).map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, locale } = await params;
  const scholarship = await getScholarship(slug);
  const t = await getTranslations({ locale, namespace: "scholarship" });
  if (!scholarship) return { title: t("metaTitle") };
  return { title: scholarship.name, description: scholarship.summary ?? undefined };
}

/** Typical steps from Figma, shown until a researcher writes this scholarship's own ("scholarship.typicalSteps"). */
const typicalSteps = ["rules", "documents", "deadline", "track"] as const;

export default async function ScholarshipPage({ params }: Props) {
  const locale = await pageLocale(params);
  const t = await getTranslations("scholarship");
  const kinds = await getTranslations("scholarshipKinds");
  const { slug } = await params;
  const [scholarship, cards] = await Promise.all([getScholarship(slug), listScholarshipCards()]);
  if (scholarship === null) {
    return (
      <Container className="py-12">
        <p className="rounded-2xl bg-tint-lavender p-5 text-body-m" role="status">
          {t("notConnected")}
        </p>
      </Container>
    );
  }
  if (!scholarship) notFound();
  const s = scholarship;

  const needBased = s.kind === "need" || s.covers.some((c) => /need/i.test(c));
  const eligibility = pointsFrom(s.who_its_for);
  const ownSteps = stepsFrom(s.how_to_apply);
  const related = relatedTo(s, cards ?? []);

  return (
    <Container className="flex flex-col pt-5 pb-7 lg:grid lg:grid-cols-[minmax(0,1fr)_380px] lg:items-start lg:gap-x-12 lg:pt-4 lg:pb-16">
      <nav
        aria-label="Breadcrumb"
        className="hidden items-center gap-1.5 text-body-s lg:col-span-2 lg:flex lg:pb-4"
      >
        <Link
          href="/scholarships"
          className="py-2.5 text-label-m text-deep-rose underline underline-offset-2 hover:text-charcoal"
        >
          {t("breadcrumb")}
        </Link>
        <ChevronRight className="size-4" strokeWidth={1.75} aria-hidden="true" />
        <span aria-current="page" className="text-muted">
          {s.name}
        </span>
      </nav>

      <header className="order-1 flex flex-col gap-3 lg:order-none lg:col-start-1 lg:row-start-2 lg:gap-3.5">
        <ChipList>
          <Chip tone="lavender">{kinds(s.kind)}</Chip>
          {needBased && <Chip tone="sage">{t("needBased")}</Chip>}
          {s.audience_note ? (
            <Chip tone="coral">{s.audience_note}</Chip>
          ) : (
            isForWomen(s) && <Chip tone="coral">{t("forWomen")}</Chip>
          )}
          {s.scope === "international" && <Chip>{t("studyAbroad")}</Chip>}
        </ChipList>
        <h1 className="text-h1 lg:text-[48px] lg:leading-[52px] lg:tracking-[-0.7px]">{s.name}</h1>
        <p className="text-body-m text-muted lg:max-w-[680px] lg:text-body-l">
          {s.summary ?? t("noSummary")}
        </p>
        <p className="text-body-s text-muted">{t("offeredBy", { provider: s.provider })}</p>
      </header>

      {/* Mobile: right after the header. Desktop: the right-hand column. */}
      <div className="contents lg:col-start-2 lg:row-span-2 lg:row-start-2 lg:flex lg:flex-col lg:gap-6">
        <div className="order-2 flex flex-col gap-3 pt-3 lg:order-1 lg:rounded-3xl lg:border lg:border-border-soft lg:bg-card lg:p-5 lg:pt-5">
          <DeadlinePanel deadline={s.deadline} note={s.deadline_note} />
          <div className="flex flex-wrap items-center gap-2">
            <VerificationBadge verifiedAt={s.last_verified_at} />
            <p className="text-caption text-muted">
              {s.last_verified_at
                ? t("lastVerified", { date: formatLongDate(s.last_verified_at, locale) })
                : t("checkWebsite")}
            </p>
            {s.source_url && <SourceBadge url={s.source_url} />}
          </div>
          <StaleNotice verifiedAt={s.last_verified_at} />
          <div className="flex flex-col gap-2.5 pt-1">
            {s.official_url ? (
              <ButtonLink href={s.official_url} external className="w-full">
                {t("apply")}
              </ButtonLink>
            ) : (
              <p className="rounded-2xl bg-tint-lavender p-3.5 text-center text-body-s">{t("noWebsite")}</p>
            )}
            <ShareButton variant="whatsapp" title={t("shareTitle", { name: s.name })} className="w-full" />
          </div>
        </div>

        <NextSteps
          className="order-4 mt-7 lg:order-3 lg:mt-0"
          items={[t("nextSteps.eligibility"), t("nextSteps.documents"), t("nextSteps.deadline")]}
          action={{ href: "/scholarships", label: t("nextSteps.action") }}
        />

        {related.length > 0 && (
          <section
            aria-labelledby="related-heading"
            className="order-5 mt-7 flex flex-col gap-3 lg:order-2 lg:mt-0 lg:gap-4"
          >
            <div className="flex items-center justify-between gap-4">
              <h2 id="related-heading" className="text-h2 lg:text-h3">
                {t("related")}
              </h2>
              <Link
                href="/scholarships"
                className="shrink-0 py-2.5 text-label-m text-deep-rose underline underline-offset-2 hover:text-charcoal lg:hidden"
              >
                {t("seeAll")}
              </Link>
            </div>
            <ul className="flex flex-col gap-3.5">
              {related.map((r) => (
                <li key={r.id} className="flex flex-col *:flex-1">
                  <ScholarshipCard scholarship={r} />
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>

      <div className="order-3 flex flex-col gap-6 pt-7 lg:order-none lg:col-start-1 lg:row-start-3 lg:gap-8 lg:pt-10">
        <Section title={t("covers")}>
          {s.covers.length > 0 && (
            <ChipList className="gap-2">
              {s.covers.map((c) => (
                <Chip key={c} tone="blush">
                  {c}
                </Chip>
              ))}
            </ChipList>
          )}
          {s.what_it_covers ? (
            <p className={s.covers.length > 0 ? "text-caption text-muted" : "text-body-m"}>
              {s.what_it_covers}
            </p>
          ) : (
            s.covers.length === 0 && <p className="text-body-s text-muted">{t("noCovers")}</p>
          )}
        </Section>

        <Section title={t("eligible")}>
          {eligibility.length > 0 ? (
            <ul className="flex flex-col gap-2.5">
              {eligibility.map((point) => (
                <li key={point} className="flex items-start gap-2.5 text-body-m">
                  <Check
                    className="mt-0.5 size-5 shrink-0 text-deep-sage"
                    strokeWidth={1.75}
                    aria-hidden="true"
                  />
                  {point}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-body-s text-muted">{t("noEligible")}</p>
          )}
        </Section>

        <Section title={t("areas")}>
          {s.eligible_areas.length > 0 ? (
            <ChipList className="gap-2">
              {s.eligible_areas.map((area) => (
                <Chip key={area} tone="sage">
                  {area}
                </Chip>
              ))}
            </ChipList>
          ) : (
            <p className="text-body-s text-muted">{t("noAreas")}</p>
          )}
        </Section>

        <Section title={t("howToApply")}>
          {ownSteps.length >= 2 ? (
            <>
              <p className="text-body-s text-muted">{t("confirmSteps")}</p>
              <ol>
                {ownSteps.map((text, i) => (
                  <Step key={text} number={i + 1} title={text} last={i === ownSteps.length - 1} />
                ))}
              </ol>
            </>
          ) : ownSteps.length === 1 ? (
            <p className="text-body-m">{ownSteps[0]}</p>
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
        </Section>

        <ImportantCallout title={t("importantTitle")}>{t("importantText")}</ImportantCallout>

        <p className="flex flex-wrap items-center gap-x-2 text-body-s text-muted">
          <CircleAlert className="size-[18px]" strokeWidth={1.75} aria-hidden="true" />
          {t("outdated")}
          <a
            href={`mailto:${contact.email}?subject=${encodeURIComponent(`Update needed: ${s.name}`)}`}
            className="py-2.5 text-label-m text-deep-rose underline underline-offset-2 hover:text-charcoal"
          >
            {t("tellUs")}
          </a>
        </p>
      </div>
    </Container>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-2.5">
      <h2 className="text-h3">{title}</h2>
      {children}
    </section>
  );
}

/** The deadline box: coral while closing soon, blush otherwise. */
function DeadlinePanel({ deadline, note }: { deadline: string | null; note: string | null }) {
  const t = useTranslations("scholarship.deadline");
  const deadlineT = useTranslations("deadline");
  const locale = useLocale() as Locale;
  const days = deadline ? daysUntil(deadline) : null;
  const urgent =
    days !== null && days >= 0 && deadlineLabel({ deadline, deadline_note: note }, deadlineT, locale).urgent;
  const heading =
    days === null ? t("toBeConfirmed") : days < 0 ? t("closed") : urgent ? t("closingSoon") : t("open");
  const detail = deadline
    ? days !== null && days < 0
      ? t("closedOn", { date: formatLongDate(deadline, locale) })
      : t("on", { date: formatLongDate(deadline, locale) })
    : (note ?? t("checkDates"));
  return (
    <div className={`flex items-center gap-3 rounded-[18px] p-4 ${urgent ? "bg-tint-coral" : "bg-blush"}`}>
      <span className="flex size-10 shrink-0 items-center justify-center rounded-pill bg-card">
        <Clock className="size-5 text-deep-rose" strokeWidth={1.75} aria-hidden="true" />
      </span>
      <div className="min-w-0 flex-1 text-charcoal">
        <p className="text-label-m">{heading}</p>
        <p className="text-body-s">{detail}</p>
        {deadline && note && <p className="text-caption text-muted">{note}</p>}
      </div>
    </div>
  );
}

/** Up to two other scholarships, those sharing a field, audience or type first. */
function relatedTo(
  s: { id: string; kind: string; fieldIds: string[] } & Parameters<typeof isForWomen>[0],
  cards: CardData[],
) {
  const women = isForWomen(s);
  return cards
    .filter((c) => c.id !== s.id)
    .map((c) => ({
      card: c,
      score:
        c.fieldIds.filter((id) => s.fieldIds.includes(id)).length * 2 +
        (women && isForWomen(c) ? 2 : 0) +
        (c.kind === s.kind ? 1 : 0),
    }))
    .sort((a, b) => b.score - a.score || a.card.name.localeCompare(b.card.name, "en"))
    .slice(0, 2)
    .map((x) => x.card);
}
