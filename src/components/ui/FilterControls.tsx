"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, SlidersHorizontal } from "lucide-react";
import { buttonStyles } from "./Button";

/**
 * Filter button (Figma 4:167) and the bottom sheet it opens on phones.
 * `showLabel` is the button that closes the sheet, e.g. "Show 12 universities".
 */
export function FilterSheet({
  count,
  showLabel,
  clearHref,
  children,
}: {
  count: number;
  showLabel: string;
  clearHref: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const sheet = useRef<HTMLDivElement>(null);
  const opener = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const trigger = opener.current;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    sheet.current?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
      trigger?.focus();
    };
  }, [open]);

  return (
    <>
      <button
        ref={opener}
        type="button"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        className="inline-flex items-center gap-2 rounded-pill border-[1.25px] border-charcoal bg-card py-2.5 pr-3 pl-4 text-label-m text-charcoal"
      >
        <SlidersHorizontal className="size-[18px]" strokeWidth={1.75} aria-hidden="true" />
        Filters
        {count > 0 && (
          <span className="flex size-[22px] items-center justify-center rounded-pill bg-coral text-label-xs">
            {count}
            <span className="sr-only"> applied</span>
          </span>
        )}
      </button>

      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Close filters"
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-charcoal/45"
          />
          <div
            ref={sheet}
            role="dialog"
            aria-modal="true"
            aria-labelledby="filters-title"
            tabIndex={-1}
            className="absolute inset-x-0 bottom-0 flex max-h-[88dvh] flex-col gap-[22px] overflow-y-auto rounded-t-[28px] bg-cream px-5 pt-2.5 pb-7 shadow-raised outline-none"
          >
            <span className="mx-auto h-1 w-10 shrink-0 rounded-[2px] bg-border-strong" aria-hidden="true" />
            <div className="flex items-center justify-between">
              <h2 id="filters-title" className="text-h2">
                Filters
              </h2>
              <button
                type="button"
                onClick={() => router.push(clearHref, { scroll: false })}
                className="py-2.5 text-label-m text-deep-rose underline underline-offset-2 hover:text-charcoal"
              >
                Clear all
              </button>
            </div>
            {children}
            <button type="button" onClick={() => setOpen(false)} className={`${buttonStyles.primary} w-full`}>
              {showLabel}
            </button>
          </div>
        </div>
      )}
    </>
  );
}

/** Input/Select for the field of study. Choosing a field updates the address. */
export function FieldSelect({
  value,
  options,
  allHref,
}: {
  value: string;
  options: { slug: string; name: string; href: string }[];
  allHref: string;
}) {
  const router = useRouter();
  return (
    <span className="relative block">
      <select
        aria-label="Field of study"
        value={value}
        onChange={(event) => {
          const option = options.find((o) => o.slug === event.target.value);
          router.push(option ? option.href : allHref, { scroll: false });
        }}
        className="h-12 w-full cursor-pointer appearance-none rounded-xl border border-border-strong bg-card pr-10 pl-3.5 text-body-m text-charcoal"
      >
        <option value="">All fields</option>
        {options.map((o) => (
          <option key={o.slug} value={o.slug}>
            {o.name}
          </option>
        ))}
      </select>
      <ChevronDown
        className="pointer-events-none absolute top-1/2 right-3.5 size-5 -translate-y-1/2"
        strokeWidth={1.75}
        aria-hidden="true"
      />
    </span>
  );
}

/** Check/Item: toggles one yes-or-no filter. */
export function FilterCheckbox({ label, checked, href }: { label: string; checked: boolean; href: string }) {
  const router = useRouter();
  return (
    <label className="flex cursor-pointer items-start gap-3 text-body-m">
      <input
        type="checkbox"
        checked={checked}
        onChange={() => router.push(href, { scroll: false })}
        className="mt-0.5 size-6 shrink-0 cursor-pointer appearance-none rounded-[7px] border-[1.5px] border-muted bg-card bg-center bg-no-repeat checked:border-deep-rose checked:bg-tint-coral checked:bg-[url('/brand/check.svg')]"
      />
      {label}
    </label>
  );
}

/** The "More cities" chip: reveals the rest of the options in place. */
export function MoreOptions({
  label,
  startOpen,
  children,
}: {
  label: string;
  startOpen: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(startOpen);
  if (open) return <>{children}</>;
  return (
    <button
      type="button"
      onClick={() => setOpen(true)}
      className="inline-flex items-center rounded-pill border border-border-strong bg-card px-4 py-[9px] text-label-m whitespace-nowrap text-charcoal hover:bg-blush"
    >
      {label}
    </button>
  );
}
