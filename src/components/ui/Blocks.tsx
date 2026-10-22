import Link from "next/link";
import { ChevronDown, CircleAlert, Lightbulb, Sprout, type LucideIcon } from "lucide-react";
import { ButtonLink } from "./Button";

/** Section header: H2 with an optional "See all" text link on the right. */
export function SectionHeader({
  title,
  href,
  linkLabel = "See all",
  as: Heading = "h2",
  className = "",
}: {
  title: React.ReactNode;
  href?: string;
  linkLabel?: React.ReactNode;
  as?: "h2" | "h3";
  className?: string;
}) {
  return (
    <div className={`flex items-center justify-between gap-4 ${className}`}>
      <Heading className="text-h2 lg:text-[40px] lg:leading-[46px]">{title}</Heading>
      {href && (
        <Link
          href={href}
          className="shrink-0 py-2.5 text-label-m text-deep-rose underline underline-offset-2 hover:text-charcoal"
        >
          {linkLabel}
        </Link>
      )}
    </div>
  );
}

/** Callout/Remember: sage panel with a handwritten heading. */
export function RememberCallout({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <aside className={`rounded-[18px] bg-tint-sage p-4 ${className}`}>
      <p className="flex items-center gap-2 text-script">
        <Lightbulb className="size-5 shrink-0" strokeWidth={1.75} aria-hidden="true" />
        Remember…
      </p>
      <p className="mt-1.5 text-body-s">{children}</p>
    </aside>
  );
}

/** Callout/Important: coral panel for warnings. */
export function ImportantCallout({
  title,
  children,
  className = "",
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <aside className={`rounded-[18px] bg-tint-coral p-4 ${className}`}>
      <p className="flex items-center gap-2 text-label-m">
        <CircleAlert className="size-5 shrink-0 text-deep-rose" strokeWidth={1.75} aria-hidden="true" />
        {title}
      </p>
      <p className="mt-1.5 text-body-s">{children}</p>
    </aside>
  );
}

/**
 * Next steps: closes every detail page with a short checklist and one clear
 * action. The ticks are only for the reader; nothing is saved.
 */
export function NextSteps({
  items,
  action,
  className = "",
}: {
  items: string[];
  action: { href: string; label: string };
  className?: string;
}) {
  return (
    <section
      aria-labelledby="next-steps"
      className={`flex flex-col gap-3.5 rounded-3xl bg-blush p-5 ${className}`}
    >
      <h2 id="next-steps" className="flex items-center gap-2.5 text-h3">
        <span className="flex size-9 items-center justify-center rounded-pill bg-card">
          <Sprout className="size-5" strokeWidth={1.75} aria-hidden="true" />
        </span>
        Your next steps
      </h2>
      <ul className="flex flex-col gap-3.5">
        {items.map((item) => (
          <li key={item}>
            <label className="flex cursor-pointer items-start gap-3 text-body-m">
              <input
                type="checkbox"
                className="mt-0.5 size-6 shrink-0 cursor-pointer appearance-none rounded-[7px] border-[1.5px] border-muted bg-card bg-center bg-no-repeat checked:border-deep-rose checked:bg-tint-coral checked:bg-[url('/brand/check.svg')]"
              />
              {item}
            </label>
          </li>
        ))}
      </ul>
      <ButtonLink href={action.href} className="w-full">
        {action.label}
      </ButtonLink>
    </section>
  );
}

/** A row of 3 px sage dots 8 px apart: the "Path" that joins steps in Figma. */
export function DottedPath({ direction }: { direction: "vertical" | "horizontal" }) {
  const vertical = direction === "vertical";
  return (
    <span
      aria-hidden="true"
      className={vertical ? "block w-[3px] flex-1" : "block h-[3px] flex-1"}
      style={{
        backgroundImage: "radial-gradient(circle, var(--color-sage) 1.5px, transparent 1.6px)",
        backgroundSize: vertical ? "3px 8px" : "8px 3px",
        backgroundRepeat: vertical ? "repeat-y" : "repeat-x",
      }}
    />
  );
}

/**
 * Accordion: a section of a detail page that opens and closes. A native
 * details element, so it works without JavaScript and is keyboard accessible.
 */
export function Accordion({
  icon: Icon,
  title,
  defaultOpen = false,
  children,
}: {
  icon: LucideIcon;
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  return (
    <details open={defaultOpen} className="group rounded-2xl border border-border-soft bg-card">
      <summary className="flex cursor-pointer list-none items-center gap-3 p-4 lg:px-5 lg:py-[18px] [&::-webkit-details-marker]:hidden">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-blush group-open:bg-tint-coral">
          <Icon className="size-5" strokeWidth={1.75} aria-hidden="true" />
        </span>
        <span className="flex-1 text-label-l">{title}</span>
        <ChevronDown
          className="size-5 shrink-0 transition-transform group-open:rotate-180"
          strokeWidth={1.75}
          aria-hidden="true"
        />
      </summary>
      <div className="flex flex-col gap-3 px-4 pb-[18px] lg:px-5 lg:pb-5">{children}</div>
    </details>
  );
}

/** Step: a numbered step joined to the next by a dotted path. */
export function Step({
  number,
  title,
  last = false,
  children,
}: {
  number: number;
  title: string;
  last?: boolean;
  children?: React.ReactNode;
}) {
  return (
    <li className="flex gap-3.5">
      <div className="flex w-9 shrink-0 flex-col items-center gap-1.5">
        <span className="flex size-9 items-center justify-center rounded-pill bg-coral text-label-m">
          {number}
        </span>
        {!last && (
          <span className="flex flex-1 flex-col items-center">
            <DottedPath direction="vertical" />
          </span>
        )}
      </div>
      <div className={`flex min-w-0 flex-1 flex-col gap-1 pt-1.5 ${last ? "" : "pb-4"}`}>
        <p className="text-label-l">{title}</p>
        {children && <p className="text-body-m text-muted">{children}</p>}
      </div>
    </li>
  );
}
