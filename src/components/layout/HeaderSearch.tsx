"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Search, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { MAX_QUERY_LENGTH, searchPath } from "@/lib/search";

const iconButton =
  "flex size-11 shrink-0 items-center justify-center rounded-pill border border-border-soft bg-card text-charcoal transition-colors hover:bg-blush";

/**
 * The header's magnifier. It opens in place into a search box over the
 * header row (no page change): Enter goes to /search?q=… in the current
 * language, Esc or a click outside closes it. An empty query does nothing.
 *
 * On a phone the box covers the whole header row (there is room for it at
 * 360 px: about 330 px wide); from 1024 px it opens over the icons beside
 * the magnifier. The panel is positioned against the header row on a phone
 * and against this component on desktop, so the parent row must be
 * `relative` on a phone. With reduced motion it simply appears.
 */
export function HeaderSearch() {
  const t = useTranslations("nav");
  const s = useTranslations("search");
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const root = useRef<HTMLSpanElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const panelId = useId();

  useEffect(() => {
    if (open) input.current?.focus();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (event.target instanceof Node && !root.current?.contains(event.target)) setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  function close() {
    setOpen(false);
    // Back to the magnifier, so keyboard users don't lose their place.
    trigger.current?.focus();
  }

  function submit(event: React.FormEvent) {
    event.preventDefault();
    const path = searchPath(query);
    if (!path) {
      input.current?.focus();
      return;
    }
    setOpen(false);
    router.push(path);
  }

  return (
    <span ref={root} className="lg:relative">
      <button
        ref={trigger}
        type="button"
        className={`${iconButton} ${open ? "invisible" : ""}`}
        aria-label={t("search")}
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen(true)}
      >
        <Search className="size-5" strokeWidth={1.75} aria-hidden="true" />
      </button>

      {open && (
        <form
          id={panelId}
          role="search"
          onSubmit={submit}
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              event.stopPropagation();
              close();
            }
          }}
          className="absolute inset-x-3 top-1/2 z-50 flex -translate-y-1/2 items-center gap-1.5 rounded-pill border border-border-strong bg-card py-1 ps-4 pe-1 shadow-sm focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-deep-rose motion-safe:animate-[search-open_150ms_ease-out] lg:inset-x-auto lg:end-0 lg:w-80"
        >
          <label htmlFor={`${panelId}-input`} className="sr-only">
            {s("label")}
          </label>
          <Search className="size-5 shrink-0 text-muted" strokeWidth={1.75} aria-hidden="true" />
          <input
            ref={input}
            id={`${panelId}-input`}
            type="search"
            enterKeyHint="search"
            value={query}
            maxLength={MAX_QUERY_LENGTH}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={s("placeholder")}
            autoComplete="off"
            className="h-9 min-w-0 flex-1 bg-transparent text-body-m text-charcoal outline-none placeholder:text-muted"
          />
          <button
            type="submit"
            className="shrink-0 rounded-pill bg-coral px-3.5 py-2 text-label-m text-ink transition-colors hover:bg-coral-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deep-rose"
          >
            {t("search")}
          </button>
          <button
            type="button"
            onClick={close}
            aria-label={s("close")}
            className="flex size-9 shrink-0 items-center justify-center rounded-pill text-charcoal transition-colors hover:bg-blush focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deep-rose"
          >
            <X className="size-5" strokeWidth={1.75} aria-hidden="true" />
          </button>
        </form>
      )}
    </span>
  );
}
