import Link from "next/link";
import { Settings, type LucideIcon } from "lucide-react";
import { buttonStyles } from "@/components/ui/Button";
import { personInitials } from "@/lib/format";

/** Building blocks shared by the admin pages (Figma Admin/* components). */

const avatarTones = ["bg-tint-sage", "bg-tint-lavender", "bg-tint-coral", "bg-blush"];

/** The same person always gets the same colour. */
function toneFor(key: string) {
  let hash = 0;
  for (const c of key) hash = (hash * 31 + c.charCodeAt(0)) >>> 0;
  return avatarTones[hash % avatarTones.length];
}

export function Avatar({
  name,
  toneKey,
  size = "md",
  tone,
}: {
  name: string;
  toneKey: string;
  size?: "sm" | "md";
  tone?: string;
}) {
  const sizes = { sm: "size-8 text-label-xs", md: "size-9 text-label-xs" };
  return (
    <span
      aria-hidden="true"
      className={`flex shrink-0 items-center justify-center rounded-pill text-charcoal ${sizes[size]} ${tone ?? toneFor(toneKey)}`}
    >
      {personInitials(name)}
    </span>
  );
}

/** Page title, its one-line description and the page's main actions (Figma "Header"). */
export function PageHeader({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children?: React.ReactNode;
}) {
  return (
    <header className="flex flex-col gap-4 lg:flex-row lg:items-center">
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <h1 className="text-h1 lg:tracking-[-0.2px]">{title}</h1>
        <p className="text-body-m text-muted">{description}</p>
      </div>
      {children && <div className="flex flex-col gap-3 sm:flex-row sm:items-center">{children}</div>}
    </header>
  );
}

/** Admin/Stat card (10:328). */
export function StatCard({
  icon: Icon,
  tone,
  label,
  value,
  caption,
  href,
}: {
  icon: LucideIcon;
  tone: string;
  label: string;
  value: number | null;
  caption: string;
  /** Where the card leads, if anywhere: the whole card is the link. */
  href?: string;
}) {
  const body = (
    <>
      <span className={`flex size-10 items-center justify-center rounded-xl ${tone}`}>
        <Icon className="size-5" strokeWidth={1.75} aria-hidden="true" />
      </span>
      <p className="text-label-m text-muted">{label}</p>
      <p className="font-serif text-[40px] leading-[46px] font-semibold tracking-[-0.2px] lining-nums">
        {value ?? "–"}
        {value == null && <span className="sr-only">Not available</span>}
      </p>
      <p className="text-caption text-muted">{caption}</p>
    </>
  );
  const box = "flex min-w-0 flex-col gap-2 rounded-[20px] border border-border-soft bg-card p-4 sm:p-5";
  return href ? (
    <Link href={href} className={`${box} hover:bg-cream`}>
      {body}
    </Link>
  ) : (
    <div className={box}>{body}</div>
  );
}

/** Admin/Activity item (10:350). */
export function ActivityItem({
  actor,
  actorId,
  text,
  when,
  extra,
}: {
  actor: string;
  /** Null for changes made by the system (seeding, the service-role key): shown with a gear. */
  actorId: string | null;
  text: string;
  when: string;
  /** Shown after the time, e.g. a link to the entry. */
  extra?: React.ReactNode;
}) {
  return (
    <li className="flex items-start gap-3">
      {actorId ? (
        <Avatar name={actor} toneKey={actorId} size="sm" />
      ) : (
        <span
          aria-hidden="true"
          className="flex size-8 shrink-0 items-center justify-center rounded-pill border border-border-soft bg-cream text-muted"
        >
          <Settings className="size-4" strokeWidth={1.75} />
        </span>
      )}
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <p className="text-body-s break-words">{text}</p>
        <p className="text-caption text-muted">
          {when}
          {extra}
        </p>
      </div>
    </li>
  );
}

/**
 * "Showing 51–100 of 240" with Previous and Next (Figma list footer). Links,
 * so the page number lives in the address. `hrefFor` builds a page's URL.
 */
export function Pager({
  page,
  pageSize,
  total,
  hrefFor,
  noun,
}: {
  page: number;
  pageSize: number;
  total: number;
  hrefFor: (page: number) => string;
  noun: string;
}) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const first = total ? (page - 1) * pageSize + 1 : 0;
  const last = Math.min(page * pageSize, total);
  return (
    <nav
      aria-label={`Pages of ${noun}`}
      className="flex flex-wrap items-center gap-x-5 gap-y-1 border-t border-border-soft px-5 py-3 lg:px-6"
    >
      <p className="flex-1 text-caption text-muted">
        {total <= pageSize ? `Showing ${total} of ${total}` : `Showing ${first}–${last} of ${total}`}
      </p>
      {page > 1 && (
        <Link href={hrefFor(page - 1)} className={buttonStyles.text}>
          Previous<span className="sr-only"> page</span>
        </Link>
      )}
      {page < pages && (
        <Link href={hrefFor(page + 1)} className={buttonStyles.text}>
          Next<span className="sr-only"> page</span>
        </Link>
      )}
    </nav>
  );
}

/** A card holding a table or list, with an H3 title row (Figma "Needs review", "Recent activity"). */
export function Panel({
  title,
  action,
  children,
  className = "",
}: {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={`overflow-hidden rounded-[20px] border border-border-soft bg-card ${className}`}>
      <div className="flex items-center gap-3 px-5 py-4 lg:px-6 lg:py-5">
        <h2 className="flex-1 text-h3">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}
