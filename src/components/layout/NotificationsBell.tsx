"use client";

import { Bell } from "lucide-react";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { UnverifiedBadge } from "@/components/ui/Chip";
import type { Locale } from "@/i18n/config";
import { Link } from "@/i18n/navigation";
import { groupDeadlines, soonCount, type Deadline } from "@/lib/deadlines";
import { daysUntil, formatLongDate } from "@/lib/format";
import { useDeadlines } from "./useDeadlines";

const iconButton =
  "relative flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-pill border border-border-soft bg-card text-charcoal transition-colors hover:bg-blush";

/**
 * The notifications bell: upcoming scholarship and admission deadlines in a
 * popover that opens on click or tap. The badge counts those in the next
 * 30 days and is left out at zero. Escape, a click outside, or moving focus
 * outside closes it; Escape returns focus to the bell.
 *
 * `icon` is the round header button with a popover under it; `row` is the
 * full-width line on the Menu screen, with the list opening inline below it.
 */
export function NotificationsBell({ variant = "icon" }: { variant?: "icon" | "row" }) {
  const t = useTranslations("notifications");
  const deadlines = useDeadlines();
  const [open, setOpen] = useState(false);
  const wrapper = useRef<HTMLDivElement>(null);
  const button = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const panelId = useId();
  const count = useMemo(() => (deadlines ? soonCount(deadlines) : 0), [deadlines]);
  const row = variant === "row";

  useEffect(() => {
    if (!open) return;
    panel.current?.focus();
    const closeOutside = (event: Event) => {
      if (!wrapper.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setOpen(false);
      button.current?.focus();
    };
    document.addEventListener("pointerdown", closeOutside);
    document.addEventListener("focusin", closeOutside);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", closeOutside);
      document.removeEventListener("focusin", closeOutside);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const label = count > 0 ? t("labelCount", { count }) : t("label");
  const badge = count > 0 && (
    <span
      aria-hidden="true"
      className="absolute -end-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-pill bg-coral px-1 text-[11px] leading-none font-semibold text-ink"
    >
      {count > 99 ? "99+" : count}
    </span>
  );

  return (
    <div ref={wrapper} className={row ? "w-full" : "relative"}>
      {row ? (
        <button
          ref={button}
          type="button"
          aria-expanded={open}
          aria-controls={panelId}
          aria-label={label}
          onClick={() => setOpen((v) => !v)}
          className="flex min-h-12 w-full cursor-pointer items-center gap-3.5 rounded-pill border border-border-soft bg-card px-3 text-start text-label-l text-charcoal hover:bg-blush"
        >
          <span className="relative flex size-9 shrink-0 items-center justify-center rounded-pill bg-blush">
            <Bell className="size-5" strokeWidth={1.75} aria-hidden="true" />
          </span>
          <span className="flex-1" aria-hidden="true">
            {t("title")}
          </span>
          {badge ? (
            <span
              aria-hidden="true"
              className="flex h-6 min-w-6 items-center justify-center rounded-pill bg-coral px-1.5 text-label-s text-ink"
            >
              {count > 99 ? "99+" : count}
            </span>
          ) : null}
        </button>
      ) : (
        <button
          ref={button}
          type="button"
          aria-expanded={open}
          aria-controls={panelId}
          aria-label={label}
          onClick={() => setOpen((v) => !v)}
          className={iconButton}
        >
          <Bell className="size-5" strokeWidth={1.75} aria-hidden="true" />
          {badge}
        </button>
      )}

      {open && (
        <div
          ref={panel}
          id={panelId}
          role="dialog"
          aria-label={t("title")}
          tabIndex={-1}
          onClick={(event) => {
            if ((event.target as HTMLElement).closest("a")) setOpen(false);
          }}
          className={`rounded-[20px] border border-border-soft bg-card p-3 text-start shadow-raised outline-none ${
            row
              ? "mt-2"
              : "absolute end-0 top-full z-50 mt-2 max-h-[min(70vh,560px)] w-[380px] max-w-[calc(100vw-2rem)] overflow-y-auto"
          }`}
        >
          <p className="px-2 pt-1 pb-2 text-label-l">{t("title")}</p>
          <DeadlineList deadlines={deadlines} />
          <p className="px-2 pt-3 pb-1 text-caption text-muted">{t("note")}</p>
        </div>
      )}
    </div>
  );
}

function DeadlineList({ deadlines }: { deadlines: Deadline[] | null }) {
  const t = useTranslations("notifications");
  const locale = useLocale() as Locale;
  if (deadlines === null) {
    return (
      <p className="px-2 py-3 text-body-s text-muted" role="status">
        {t("loading")}
      </p>
    );
  }
  if (deadlines.length === 0) {
    return <p className="rounded-2xl bg-blush p-4 text-body-s">{t("empty")}</p>;
  }
  return (
    <div className="flex flex-col gap-3">
      {groupDeadlines(deadlines).map((group) => (
        <section key={group.kind} aria-labelledby={`deadlines-${group.kind}`}>
          <h3 id={`deadlines-${group.kind}`} className="px-2 pb-1 text-label-s text-muted">
            {t(`groups.${group.kind === "scholarship" ? "scholarships" : "admissions"}`)}
          </h3>
          <ul className="flex flex-col">
            {group.items.map((d) => (
              <li key={`${d.kind}-${d.slug}`}>
                <Link
                  href={`/${d.kind === "scholarship" ? "scholarships" : "universities"}/${d.slug}`}
                  className="flex flex-col gap-1 rounded-xl px-2 py-2.5 hover:bg-blush"
                >
                  <span className="text-label-m" lang="en">
                    {d.name}
                  </span>
                  <span className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-caption text-muted">
                    <time dateTime={d.date}>{formatLongDate(d.date, locale)}</time>
                    <span aria-hidden="true">·</span>
                    <span>{t("daysLeft", { count: daysUntil(d.date) })}</span>
                  </span>
                  {!d.verified && (
                    <span className="self-start">
                      <UnverifiedBadge />
                    </span>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
