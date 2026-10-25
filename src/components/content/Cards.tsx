import { ChevronRight, ExternalLink, MapPin, type LucideIcon } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import type { Locale } from "@/i18n/config";
import { Link } from "@/i18n/navigation";
import { Chip, ChipList, DeadlineChip, VerificationBadge } from "@/components/ui/Chip";
import { Ltr } from "@/components/ui/Ltr";
import type {
  FieldSummary,
  ScholarshipCard as ScholarshipCardData,
  UniversityCard as UniversityCardData,
} from "@/lib/data/public";
import { daysUntil, formatShortDate, hostOf, initialsFor } from "@/lib/format";
import { FieldIcon } from "./FieldIcon";

const card =
  "group flex flex-col rounded-[20px] border border-border-soft bg-card p-4 transition-shadow hover:shadow-raised focus-visible:shadow-raised";

// ---------------------------------------------------------------------------
// Card/Field
// ---------------------------------------------------------------------------

/** `reason` replaces the "You might enjoy this if…" line, e.g. on quiz results. */
export function FieldCard({ field, reason }: { field: FieldSummary; reason?: string }) {
  const t = useTranslations("cards");
  return (
    <Link href={`/explore/${field.slug}`} className={`${card} flex-row items-start gap-3.5`}>
      <FieldIcon slug={field.slug} />
      <span className="flex min-w-0 flex-1 flex-col gap-1">
        <span className="text-label-l">{field.name}</span>
        {reason ? (
          <span className="text-body-s text-muted">{reason}</span>
        ) : (
          field.you_might_enjoy && (
            <span className="text-body-s text-muted">
              {t("youMightEnjoy", { interests: field.you_might_enjoy })}
            </span>
          )
        )}
        {field.example_programmes.length > 0 && (
          <span className="text-label-s text-deep-sage">{field.example_programmes.join(", ")}</span>
        )}
      </span>
      <ChevronRight
        className="size-5 shrink-0 text-charcoal transition-transform group-hover:translate-x-0.5 rtl:group-hover:-translate-x-0.5"
        strokeWidth={1.75}
        aria-hidden="true"
      />
    </Link>
  );
}

// ---------------------------------------------------------------------------
// Card/University
// ---------------------------------------------------------------------------

const avatarTints = ["bg-blush", "bg-tint-lavender", "bg-tint-sage", "bg-tint-coral"];

/** Same university, same avatar colour, wherever it appears. */
export function avatarTint(slug: string) {
  let hash = 0;
  for (const ch of slug) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  return avatarTints[hash % avatarTints.length];
}

export function UniversityAvatar({
  slug,
  name,
  shortName,
  size = "md",
}: {
  slug: string;
  name: string;
  shortName: string | null;
  size?: "md" | "lg";
}) {
  return (
    <span
      aria-hidden="true"
      className={`flex shrink-0 items-center justify-center rounded-pill ${avatarTint(slug)} ${
        size === "lg" ? "size-16 text-label-l lg:size-[72px]" : "size-12 text-label-s"
      }`}
    >
      {initialsFor(name, shortName)}
    </span>
  );
}

export function UniversityCard({
  university: u,
  fieldId,
}: {
  university: UniversityCardData;
  fieldId?: string;
}) {
  const t = useTranslations("cards");
  const programmeCount = fieldId
    ? u.programmes.filter((p) => p.fieldId === fieldId).length
    : u.programmes.length;
  return (
    <Link href={`/universities/${u.slug}`} className={`${card} gap-3`}>
      <span className="flex items-center gap-3">
        <UniversityAvatar slug={u.slug} name={u.name} shortName={u.short_name} />
        <span className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="text-label-l">{u.name}</span>
          <span className="flex items-center gap-1 text-body-s text-muted">
            <MapPin className="size-3.5 shrink-0" strokeWidth={1.75} aria-hidden="true" />
            {u.campuses_note ?? u.city}
          </span>
        </span>
        <ChevronRight
          className="size-5 shrink-0 transition-transform group-hover:translate-x-0.5 rtl:group-hover:-translate-x-0.5"
          strokeWidth={1.75}
          aria-hidden="true"
        />
      </span>
      <ChipList>
        {u.type && <Chip tone="lavender">{t(u.type === "public" ? "public" : "private")}</Chip>}
        {u.women_only && <Chip tone="coral">{t("womenOnly")}</Chip>}
        {programmeCount > 0 && <Chip>{t("programmes", { count: programmeCount })}</Chip>}
        {u.need_based_aid && <Chip>{t("financialAid")}</Chip>}
      </ChipList>
      <span className="h-px bg-border-soft" aria-hidden="true" />
      <span className="flex flex-wrap items-center justify-between gap-2">
        <DeadlineChip>
          {t("applications", { window: u.admissions_window ?? t("datesToBeConfirmed") })}
        </DeadlineChip>
        <VerificationBadge verifiedAt={u.last_verified_at} />
      </span>
    </Link>
  );
}

// ---------------------------------------------------------------------------
// Card/Scholarship
// ---------------------------------------------------------------------------

/** The "deadline" messages, from useTranslations("deadline") or getTranslations("deadline"). */
type DeadlineT = (
  key: "closed" | "closingSoon" | "closes" | "toBeConfirmed",
  values?: { date: string },
) => string;

/**
 * "Closes 12 Mar", "Closing soon: 12 Mar" (within 30 days) or the deadline note.
 * `t` is the "deadline" translator; the date is written in `locale`.
 */
export function deadlineLabel(
  s: Pick<ScholarshipCardData, "deadline" | "deadline_note">,
  t: DeadlineT,
  locale: Locale,
) {
  if (s.deadline) {
    const days = daysUntil(s.deadline);
    const date = formatShortDate(s.deadline, locale);
    if (days < 0) return { text: t("closed", { date }), urgent: false };
    if (days <= 30) return { text: t("closingSoon", { date }), urgent: true };
    return { text: t("closes", { date }), urgent: false };
  }
  return { text: s.deadline_note ?? t("toBeConfirmed"), urgent: false };
}

export function ScholarshipCard({ scholarship: s }: { scholarship: ScholarshipCardData }) {
  const t = useTranslations("cards");
  const kinds = useTranslations("scholarshipKinds");
  const deadline = deadlineLabel(s, useTranslations("deadline"), useLocale() as Locale);
  const needBased = s.kind === "need" || s.covers.some((c) => /need/i.test(c));
  return (
    <Link href={`/scholarships/${s.slug}`} className={`${card} gap-2.5`}>
      <ChipList>
        <Chip tone="lavender">{kinds(s.kind)}</Chip>
        {needBased && <Chip tone="sage">{t("needBased")}</Chip>}
        {s.audience_note && <Chip tone="coral">{s.audience_note}</Chip>}
      </ChipList>
      <span className="text-label-l">{s.name}</span>
      {s.summary && <span className="text-body-s text-muted">{s.summary}</span>}
      {s.covers.length > 0 && (
        <span className="flex flex-wrap items-center gap-1.5">
          <span className="text-label-s text-muted">{t("covers")}</span>
          {s.covers.map((c) => (
            <Chip key={c} tone="blush">
              {c}
            </Chip>
          ))}
        </span>
      )}
      <span className="mt-auto h-px bg-border-soft" aria-hidden="true" />
      <span className="flex flex-wrap items-center justify-between gap-2">
        <DeadlineChip urgent={deadline.urgent}>{deadline.text}</DeadlineChip>
        <VerificationBadge verifiedAt={s.last_verified_at} />
      </span>
    </Link>
  );
}

// ---------------------------------------------------------------------------
// Card/Resource
// ---------------------------------------------------------------------------

/**
 * Card/Resource (Figma 4:355): an official link with its site underneath.
 * External links open in a new tab; a `href` on this site doesn't.
 */
export function ResourceCard({
  title,
  description,
  href,
  source,
  icon: Icon,
}: {
  title: string;
  description: string | null;
  /** null shows the card as "Coming soon" with no link. */
  href: string | null;
  /** Small deep-rose line, e.g. "hec.gov.pk". Defaults to the link's site. */
  source?: string;
  icon: LucideIcon;
}) {
  const t = useTranslations("cards");
  const common = useTranslations("common");
  const external = !!href && !href.startsWith("/");
  const body = (
    <>
      <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-tint-lavender">
        <Icon className="size-5" strokeWidth={1.75} aria-hidden="true" />
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="text-label-l">{title}</span>
        {description && <span className="text-body-s text-muted">{description}</span>}
        <span className="text-caption break-words text-deep-rose">
          {href ? (source ?? (external ? <Ltr>{hostOf(href)}</Ltr> : t("humraah"))) : common("comingSoon")}
        </span>
      </span>
      {href &&
        (external ? (
          <ExternalLink className="size-5 shrink-0 text-deep-rose" strokeWidth={1.75} aria-hidden="true" />
        ) : (
          <ChevronRight className="size-5 shrink-0" strokeWidth={1.75} aria-hidden="true" />
        ))}
    </>
  );
  const classes = "flex items-center gap-3 rounded-2xl border border-border-soft bg-card p-4";
  if (!href) return <div className={classes}>{body}</div>;
  if (!external)
    return (
      <Link href={href} className={`${classes} transition-shadow hover:shadow-raised`}>
        {body}
      </Link>
    );
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`${classes} transition-shadow hover:shadow-raised`}
    >
      {body}
      <span className="sr-only">{common("opensInNewTab")}</span>
    </a>
  );
}
