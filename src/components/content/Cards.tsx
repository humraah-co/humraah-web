import Link from "next/link";
import { ChevronRight, MapPin } from "lucide-react";
import { Chip, ChipList, DeadlineChip, VerificationBadge } from "@/components/ui/Chip";
import type {
  FieldSummary,
  ScholarshipCard as ScholarshipCardData,
  UniversityCard as UniversityCardData,
} from "@/lib/data/public";
import { daysUntil, formatShortDate, initialsFor } from "@/lib/format";
import { FieldIcon } from "./FieldIcon";

const card =
  "group flex flex-col rounded-[20px] border border-border-soft bg-card p-4 transition-shadow hover:shadow-raised focus-visible:shadow-raised";

// ---------------------------------------------------------------------------
// Card/Field
// ---------------------------------------------------------------------------

export function FieldCard({ field }: { field: FieldSummary }) {
  return (
    <Link href={`/explore/${field.slug}`} className={`${card} flex-row items-start gap-3.5`}>
      <FieldIcon slug={field.slug} />
      <span className="flex min-w-0 flex-1 flex-col gap-1">
        <span className="text-label-l">{field.name}</span>
        {field.you_might_enjoy && (
          <span className="text-body-s text-muted">
            You might enjoy this if you like {field.you_might_enjoy}.
          </span>
        )}
        {field.example_programmes.length > 0 && (
          <span className="text-label-s text-deep-sage">{field.example_programmes.join(", ")}</span>
        )}
      </span>
      <ChevronRight
        className="size-5 shrink-0 text-charcoal transition-transform group-hover:translate-x-0.5"
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
          className="size-5 shrink-0 transition-transform group-hover:translate-x-0.5"
          strokeWidth={1.75}
          aria-hidden="true"
        />
      </span>
      <ChipList>
        {u.type && <Chip tone="lavender">{u.type === "public" ? "Public" : "Private"}</Chip>}
        {u.women_only && <Chip tone="coral">Women only</Chip>}
        {programmeCount > 0 && (
          <Chip>
            {programmeCount} {programmeCount === 1 ? "programme" : "programmes"}
          </Chip>
        )}
        {u.need_based_aid && <Chip>Financial aid</Chip>}
      </ChipList>
      <span className="h-px bg-border-soft" aria-hidden="true" />
      <span className="flex flex-wrap items-center justify-between gap-2">
        <DeadlineChip>Applications: {u.admissions_window ?? "dates to be confirmed"}</DeadlineChip>
        <VerificationBadge verifiedAt={u.last_verified_at} />
      </span>
    </Link>
  );
}

// ---------------------------------------------------------------------------
// Card/Scholarship
// ---------------------------------------------------------------------------

const kindLabels: Record<ScholarshipCardData["kind"], string> = {
  government: "Government",
  external: "External",
  university: "University aid",
  need: "Government",
  merit: "Merit",
};

/** "Closes 12 Mar", "Closing soon: 12 Mar" (within 30 days) or the deadline note. */
export function deadlineLabel(s: Pick<ScholarshipCardData, "deadline" | "deadline_note">) {
  if (s.deadline) {
    const days = daysUntil(s.deadline);
    const date = formatShortDate(s.deadline);
    if (days < 0) return { text: `Closed ${date}`, urgent: false };
    if (days <= 30) return { text: `Closing soon: ${date}`, urgent: true };
    return { text: `Closes ${date}`, urgent: false };
  }
  return { text: s.deadline_note ?? "Deadline to be confirmed", urgent: false };
}

export function ScholarshipCard({ scholarship: s }: { scholarship: ScholarshipCardData }) {
  const deadline = deadlineLabel(s);
  const needBased = s.kind === "need" || s.covers.some((c) => /need/i.test(c));
  return (
    <Link href={`/scholarships/${s.slug}`} className={`${card} gap-2.5`}>
      <ChipList>
        <Chip tone="lavender">{kindLabels[s.kind]}</Chip>
        {needBased && <Chip tone="sage">Need-based</Chip>}
        {s.audience_note && <Chip tone="coral">{s.audience_note}</Chip>}
      </ChipList>
      <span className="text-label-l">{s.name}</span>
      {s.summary && <span className="text-body-s text-muted">{s.summary}</span>}
      {s.covers.length > 0 && (
        <span className="flex flex-wrap items-center gap-1.5">
          <span className="text-label-s text-muted">Covers</span>
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
