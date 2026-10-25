import { Check, CircleAlert, Clock, ExternalLink, Landmark, ShieldCheck, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

/**
 * Chips and badges from the Figma design system (Chip/*, Badge/*).
 * All are 12 px SemiBold labels on a pill.
 */

const tones = {
  sage: "bg-tint-sage",
  lavender: "bg-tint-lavender",
  coral: "bg-tint-coral",
  blush: "bg-blush",
  outline: "border border-border-soft bg-card",
} as const;

export type ChipTone = keyof typeof tones;

export function Chip({ tone = "outline", children }: { tone?: ChipTone; children: React.ReactNode }) {
  return (
    <span
      className={`inline-flex items-center rounded-pill px-3 py-1.5 text-label-s whitespace-nowrap text-charcoal ${tones[tone]}`}
    >
      {children}
    </span>
  );
}

export function ChipList({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`flex flex-wrap gap-1.5 ${className}`}>{children}</div>;
}

const badge =
  "inline-flex items-center gap-1.5 rounded-pill py-1 pr-2.5 pl-2 text-label-s whitespace-nowrap text-charcoal";

/** Badge/Verified: a researcher has checked this against the official source. */
export function VerifiedBadge() {
  const t = useTranslations("badges");
  return (
    <span className={`${badge} bg-tint-sage`}>
      <ShieldCheck className="size-3.5 text-deep-sage" strokeWidth={2} aria-hidden="true" />
      {t("verified")}
    </span>
  );
}

/** Badge/Unverified: shown until a researcher verifies the entry. */
export function UnverifiedBadge() {
  const t = useTranslations("badges");
  return (
    <span className={`${badge} bg-tint-coral`}>
      <CircleAlert className="size-3.5 text-deep-rose" strokeWidth={2} aria-hidden="true" />
      {t("notYetVerified")}
    </span>
  );
}

export function VerificationBadge({ verifiedAt }: { verifiedAt: string | null }) {
  return verifiedAt ? <VerifiedBadge /> : <UnverifiedBadge />;
}

export function HecBadge() {
  const t = useTranslations("badges");
  return (
    <span className={`${badge} bg-tint-lavender`}>
      <Landmark className="size-3.5" strokeWidth={2} aria-hidden="true" />
      {t("hecRecognised")}
    </span>
  );
}

/** Badge/Official: links to the page the details were checked against. */
export function SourceBadge({ url }: { url: string }) {
  const t = useTranslations("badges");
  const common = useTranslations("common");
  let host = url;
  try {
    host = new URL(url).hostname.replace(/^www\./, "");
  } catch {
    // keep the raw value
  }
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className={`${badge} border border-border-soft bg-card hover:bg-blush`}
    >
      <ExternalLink className="size-3.5" strokeWidth={2} aria-hidden="true" />
      {t("source", { host })}
      <span className="sr-only">{common("opensInNewTab")}</span>
    </a>
  );
}

/** Chip/Deadline. `urgent` switches to the coral "closing soon" style. */
export function DeadlineChip({ children, urgent = false }: { children: React.ReactNode; urgent?: boolean }) {
  return (
    <span
      // Stays on one line when there's room; long text ("dates to be confirmed") wraps inside narrow cards.
      className={`inline-flex max-w-full items-center gap-1.5 rounded-[10px] px-2.5 py-1.5 text-label-s text-charcoal ${
        urgent ? "bg-tint-coral" : "bg-blush"
      }`}
    >
      <Clock className="size-4 shrink-0" strokeWidth={1.75} aria-hidden="true" />
      {children}
    </span>
  );
}

/**
 * Chip/Option and Chip/Option selected: a filter choice. A link, so the choice
 * lives in the page address and works without JavaScript.
 */
export function OptionChip({
  href,
  selected = false,
  children,
}: {
  href: string;
  selected?: boolean;
  children: React.ReactNode;
}) {
  const t = useTranslations("common");
  return (
    <Link
      href={href}
      scroll={false}
      aria-current={selected ? "true" : undefined}
      className={`inline-flex items-center gap-1.5 rounded-pill py-[9px] text-label-m whitespace-nowrap text-charcoal transition-colors ${
        selected
          ? "border-[1.5px] border-deep-rose bg-tint-coral pr-4 pl-3"
          : "border border-border-strong bg-card px-4 hover:bg-blush"
      }`}
    >
      {selected && <Check className="size-3.5" strokeWidth={2} aria-hidden="true" />}
      {children}
      {selected && <span className="sr-only">{t("selected")}</span>}
    </Link>
  );
}

/** Chip/Filter active: an applied filter; following the link removes it. */
export function ActiveFilterChip({ href, children }: { href: string; children: React.ReactNode }) {
  const t = useTranslations("common");
  return (
    <Link
      href={href}
      scroll={false}
      className="inline-flex items-center gap-1.5 rounded-pill border-[1.5px] border-coral bg-tint-coral py-[7px] pr-2.5 pl-3.5 text-label-s whitespace-nowrap text-charcoal hover:bg-blush"
    >
      {children}
      <X className="size-3.5" strokeWidth={2} aria-hidden="true" />
      <span className="sr-only">{t("removeFilter")}</span>
    </Link>
  );
}
