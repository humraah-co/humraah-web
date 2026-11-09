import { ChevronRight, ExternalLink, MapPin, type LucideIcon } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import type { Locale } from "@/i18n/config";
import { Link } from "@/i18n/navigation";
import { Chip, ChipList, DeadlineChip, VerificationBadge } from "@/components/ui/Chip";
import { englishAttrs } from "@/components/ui/InEnglish";
import { Ltr } from "@/components/ui/Ltr";
import type {
  FieldSummary,
  ScholarshipCard as ScholarshipCardData,
  UniversityCard as UniversityCardData,
} from "@/lib/data/public";
import { daysUntil, formatShortDate, hostOf, initialsFor } from "@/lib/format";
import { FieldIcon } from "./FieldIcon";

/**
 * Every grid card has the same anatomy, top to bottom: a row of tags, the
 * title (two lines at most), a short description (three lines at most), then
 * a bottom group pinned to the foot of the card: meta chips, a divider and
 * the footer (deadline and verification). The card fills its grid cell, so
 * cards in a row are equally tall and their footers line up. Hover and focus
 * only change the border colour.
 */
const card =
  "group flex h-full w-full min-w-0 flex-col gap-3 rounded-[20px] border border-border-soft bg-card p-4 transition-colors hover:border-border-strong focus-visible:border-border-strong lg:p-5";

/** Two lines at most, and two lines of room so descriptions below start at the same height. */
const cardTitle = "line-clamp-2 min-h-[2lh] text-label-l";
const cardText = "line-clamp-3 text-body-s text-muted";

/** A divider and a footer row, the last thing in the bottom group. */
function CardFooter({ children }: { children: React.ReactNode }) {
  return (
    <>
      <span className="h-px bg-border-soft" aria-hidden="true" />
      <span className="flex flex-wrap items-center justify-between gap-2">{children}</span>
    </>
  );
}

/** The group pinned to the bottom of the card. */
function CardBottom({ children }: { children: React.ReactNode }) {
  return <span className="mt-auto flex flex-col gap-3">{children}</span>;
}

const cardArrow = "size-5 shrink-0 text-charcoal";

// ---------------------------------------------------------------------------
// Card/Field
// ---------------------------------------------------------------------------

/** `reason` replaces the "You might enjoy this if…" line, e.g. on quiz results. */
export function FieldCard({ field, reason }: { field: FieldSummary; reason?: string }) {
  const t = useTranslations("cards");
  return (
    <Link href={`/explore/${field.slug}`} className={card}>
      <span className="flex items-center gap-3.5">
        <FieldIcon slug={field.slug} />
        <span className={`${cardTitle} min-w-0 flex-1`} {...englishAttrs(field, "name")}>
          {field.name}
        </span>
        <ChevronRight className={cardArrow} strokeWidth={1.75} aria-hidden="true" />
      </span>
      {reason ? (
        <span className={cardText}>{reason}</span>
      ) : (
        field.you_might_enjoy && (
          <span className={cardText}>
            {englishAttrs(field, "you_might_enjoy").lang ? (
              <span lang="en" dir="ltr">
                {field.you_might_enjoy}
              </span>
            ) : (
              t("youMightEnjoy", { interests: field.you_might_enjoy })
            )}
          </span>
        )
      )}
      {field.example_programmes.length > 0 && (
        <CardBottom>
          <span
            className="line-clamp-2 text-label-s text-deep-sage"
            {...englishAttrs(field, "example_programmes")}
          >
            {field.example_programmes.join(", ")}
          </span>
        </CardBottom>
      )}
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
    <Link href={`/universities/${u.slug}`} className={card}>
      <ChipList lines={1} reserve>
        {u.type && <Chip tone="lavender">{t(u.type === "public" ? "public" : "private")}</Chip>}
        {u.women_only && <Chip tone="coral">{t("womenOnly")}</Chip>}
      </ChipList>
      <span className="flex items-center gap-3.5">
        <UniversityAvatar slug={u.slug} name={u.name} shortName={u.short_name} />
        {/* Names stay in English; lang tells screen readers, the text still lines up with the card. */}
        <span className={`${cardTitle} min-w-0 flex-1`} lang="en">
          {u.name}
        </span>
        <ChevronRight className={cardArrow} strokeWidth={1.75} aria-hidden="true" />
      </span>
      <span className="flex items-start gap-1.5 text-body-s text-muted">
        <MapPin className="mt-[3px] size-3.5 shrink-0" strokeWidth={1.75} aria-hidden="true" />
        {u.campuses_note ? (
          <span className="line-clamp-2" {...englishAttrs(u, "campuses_note")}>
            {u.campuses_note}
          </span>
        ) : (
          <span className="line-clamp-2" lang="en">
            {u.city}
          </span>
        )}
      </span>
      <CardBottom>
        {(programmeCount > 0 || u.need_based_aid) && (
          <ChipList lines={2}>
            {programmeCount > 0 && <Chip>{t("programmes", { count: programmeCount })}</Chip>}
            {u.need_based_aid && <Chip>{t("financialAid")}</Chip>}
          </ChipList>
        )}
        <CardFooter>
          <DeadlineChip>
            {u.admissions_window && englishAttrs(u, "admissions_window").lang ? (
              <span lang="en" dir="ltr">
                {u.admissions_window}
              </span>
            ) : (
              t("applications", { window: u.admissions_window ?? t("datesToBeConfirmed") })
            )}
          </DeadlineChip>
          <VerificationBadge verifiedAt={u.last_verified_at} />
        </CardFooter>
      </CardBottom>
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

/** Need-based by type, or by what it covers (in English or Urdu). */
export function isNeedBased(s: Pick<ScholarshipCardData, "kind" | "covers">) {
  return s.kind === "need" || s.covers.some((c) => /need|ضرورت/i.test(c));
}

export function ScholarshipCard({ scholarship: s }: { scholarship: ScholarshipCardData }) {
  const t = useTranslations("cards");
  const kinds = useTranslations("scholarshipKinds");
  const deadline = deadlineLabel(s, useTranslations("deadline"), useLocale() as Locale);
  const needBased = isNeedBased(s);
  return (
    <Link href={`/scholarships/${s.slug}`} className={card}>
      <ChipList lines={2} reserve>
        <Chip tone="lavender">{kinds(s.kind)}</Chip>
        {needBased && <Chip tone="sage">{t("needBased")}</Chip>}
        {s.audience_note && (
          <Chip tone="coral" {...englishAttrs(s, "audience_note")}>
            {s.audience_note}
          </Chip>
        )}
      </ChipList>
      <span className={cardTitle} lang="en">
        {s.name}
      </span>
      {s.summary && (
        <span className={cardText} {...englishAttrs(s, "summary")}>
          {s.summary}
        </span>
      )}
      <CardBottom>
        {s.covers.length > 0 && (
          <span className="flex items-start gap-1.5">
            <span className="py-1.5 text-label-s text-muted">{t("covers")}</span>
            <ChipList lines={2} className="min-w-0 flex-1">
              {s.covers.map((c) => (
                <Chip key={c} tone="blush" {...englishAttrs(s, "covers")}>
                  {c}
                </Chip>
              ))}
            </ChipList>
          </span>
        )}
        <CardFooter>
          <DeadlineChip urgent={deadline.urgent}>{deadline.text}</DeadlineChip>
          <VerificationBadge verifiedAt={s.last_verified_at} />
        </CardFooter>
      </CardBottom>
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
  english = [],
}: {
  title: string;
  description: string | null;
  /** Of "title" and "description", those shown in English on an Urdu page. */
  english?: string[];
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
      <span className="flex size-12 shrink-0 items-center justify-center rounded-pill bg-tint-lavender">
        <Icon className="size-[22px]" strokeWidth={1.75} aria-hidden="true" />
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-1 self-stretch">
        <span className="line-clamp-2 text-label-l" {...englishAttrs({ english }, "title")}>
          {title}
        </span>
        {description && (
          <span className="line-clamp-3 text-body-s text-muted" {...englishAttrs({ english }, "description")}>
            {description}
          </span>
        )}
        <span className="mt-auto line-clamp-1 pt-1 text-caption break-words text-deep-rose">
          {href ? (source ?? (external ? <Ltr>{hostOf(href)}</Ltr> : t("humraah"))) : common("comingSoon")}
        </span>
      </span>
      {href &&
        (external ? (
          <ExternalLink
            className="mt-3 size-5 shrink-0 text-deep-rose"
            strokeWidth={1.75}
            aria-hidden="true"
          />
        ) : (
          <ChevronRight className="mt-3 size-5 shrink-0" strokeWidth={1.75} aria-hidden="true" />
        ))}
    </>
  );
  const classes =
    "group flex h-full w-full min-w-0 items-start gap-3.5 rounded-[20px] border border-border-soft bg-card p-4 transition-colors lg:p-5";
  const interactive = "hover:border-border-strong focus-visible:border-border-strong";
  if (!href) return <div className={classes}>{body}</div>;
  if (!external)
    return (
      <Link href={href} className={`${classes} ${interactive}`}>
        {body}
      </Link>
    );
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className={`${classes} ${interactive}`}>
      {body}
      <span className="sr-only">{common("opensInNewTab")}</span>
    </a>
  );
}
