import type { LucideIcon } from "lucide-react";
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
}: {
  icon: LucideIcon;
  tone: string;
  label: string;
  value: number | null;
  caption: string;
}) {
  return (
    <div className="flex min-w-0 flex-col gap-2 rounded-[20px] border border-border-soft bg-card p-4 sm:p-5">
      <span className={`flex size-10 items-center justify-center rounded-xl ${tone}`}>
        <Icon className="size-5" strokeWidth={1.75} aria-hidden="true" />
      </span>
      <p className="text-label-m text-muted">{label}</p>
      <p className="font-serif text-[40px] leading-[46px] font-semibold tracking-[-0.2px] lining-nums">
        {value ?? "–"}
        {value == null && <span className="sr-only">Not available</span>}
      </p>
      <p className="text-caption text-muted">{caption}</p>
    </div>
  );
}

/** Admin/Activity item (10:350). */
export function ActivityItem({
  actor,
  actorKey,
  text,
  when,
}: {
  actor: string;
  actorKey: string;
  text: string;
  when: string;
}) {
  return (
    <li className="flex items-start gap-3">
      <Avatar name={actor} toneKey={actorKey} size="sm" />
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <p className="text-body-s break-words">{text}</p>
        <p className="text-caption text-muted">{when}</p>
      </div>
    </li>
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
