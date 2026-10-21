import Link from "next/link";
import { CircleAlert, Lightbulb, Sprout } from "lucide-react";
import { ButtonLink } from "./Button";

/** Section header: H2 with an optional "See all" text link on the right. */
export function SectionHeader({
  title,
  href,
  linkLabel = "See all",
  as: Heading = "h2",
  className = "",
}: {
  title: string;
  href?: string;
  linkLabel?: string;
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
export function RememberCallout({ children }: { children: React.ReactNode }) {
  return (
    <aside className="rounded-[18px] bg-tint-sage p-4">
      <p className="flex items-center gap-2 text-script">
        <Lightbulb className="size-5 shrink-0" strokeWidth={1.75} aria-hidden="true" />
        Remember…
      </p>
      <p className="mt-1.5 text-body-s">{children}</p>
    </aside>
  );
}

/** Callout/Important: coral panel for warnings. */
export function ImportantCallout({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <aside className="rounded-[18px] bg-tint-coral p-4">
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
}: {
  items: string[];
  action: { href: string; label: string };
}) {
  return (
    <section aria-labelledby="next-steps" className="flex flex-col gap-3.5 rounded-3xl bg-blush p-5">
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
