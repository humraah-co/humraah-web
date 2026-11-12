"use client";

import { Check, Monitor, Moon, Sun, type LucideIcon } from "lucide-react";
import { useEffect, useId, useRef, useState, useSyncExternalStore } from "react";
import { useTranslations } from "next-intl";
import {
  DEFAULT_CHOICE,
  parseChoice,
  resolveTheme,
  THEME_ATTRIBUTE,
  THEME_CHOICES,
  THEME_COLORS,
  THEME_STORAGE_KEY,
  type Theme,
  type ThemeChoice,
} from "@/lib/theme/script";

const icons: Record<ThemeChoice, LucideIcon> = { light: Sun, dark: Moon, system: Monitor };

/** The saved choice, read from storage (blocked storage means no saved choice, so Light). */
function read(): ThemeChoice {
  try {
    return parseChoice(localStorage.getItem(THEME_STORAGE_KEY));
  } catch {
    return DEFAULT_CHOICE;
  }
}

const listeners = new Set<() => void>();

function subscribe(onChange: () => void) {
  listeners.add(onChange);
  // Another tab changed the choice: follow it.
  const onStorage = (event: StorageEvent) => {
    if (event.key !== THEME_STORAGE_KEY) return;
    apply(resolveTheme(event.newValue, computerPrefersDark()));
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(onChange);
    window.removeEventListener("storage", onStorage);
  };
}

function computerPrefersDark() {
  try {
    return matchMedia("(prefers-color-scheme: dark)").matches;
  } catch {
    return false;
  }
}

function apply(theme: Theme) {
  const root = document.documentElement;
  root.setAttribute(THEME_ATTRIBUTE, theme);
  document
    .querySelectorAll('meta[name="theme-color"]')
    .forEach((meta) => meta.setAttribute("content", THEME_COLORS[theme]));
  listeners.forEach((listener) => listener());
}

/** A brief colour fade (globals.css drops it for people who ask for less motion). */
function fade() {
  const root = document.documentElement;
  root.classList.add("theme-fade");
  window.setTimeout(() => root.classList.remove("theme-fade"), 200);
}

function choose(choice: ThemeChoice) {
  fade();
  try {
    localStorage.setItem(THEME_STORAGE_KEY, choice);
  } catch {
    // Storage blocked: the choice still applies to this page, it just isn't remembered.
  }
  // The inline script in <head> keeps a System choice in step with the computer from here on.
  apply(resolveTheme(choice, computerPrefersDark()));
}

function useChoice() {
  // The server renders Light; the saved choice is read after hydration.
  return useSyncExternalStore(subscribe, read, () => DEFAULT_CHOICE);
}

/**
 * Light, Dark or System.
 * - `icon` (header, sign-in page): a round button showing the current
 *   choice's icon; it opens a small panel of the three choices, each with
 *   an icon, a name and a tick on the active one. Escape or a click outside
 *   closes it.
 * - `row` (the Menu screen, the workspace sidebar): the three choices side by
 *   side, always visible.
 * The active choice is shown by a tick or a filled button and is announced
 * (aria-pressed), never by colour alone.
 */
export function ThemeToggle({ variant = "icon" }: { variant?: "icon" | "row" }) {
  const choice = useChoice();
  return variant === "row" ? <ThemeRow choice={choice} /> : <ThemeMenu choice={choice} />;
}

function ThemeRow({ choice }: { choice: ThemeChoice }) {
  const t = useTranslations("theme");
  const labelId = useId();
  return (
    <div role="group" aria-labelledby={labelId} className="flex flex-col gap-2">
      <p id={labelId} className="text-label-s text-muted">
        {t("label")}
      </p>
      <div className="flex gap-1.5 segment-group border border-border-soft bg-card p-(--segment-pad)">
        {THEME_CHOICES.map((value) => {
          const Icon = icons[value];
          const active = value === choice;
          return (
            <button
              key={value}
              type="button"
              aria-pressed={active}
              onClick={() => choose(value)}
              className={`flex min-h-11 min-w-0 flex-1 cursor-pointer flex-col items-center justify-center gap-0.5 segment-option px-1 py-1.5 text-label-s text-charcoal transition-colors ${
                active ? "bg-tint-coral" : "hover:bg-blush"
              }`}
            >
              <Icon className="size-[18px]" strokeWidth={1.75} fill="none" aria-hidden="true" />
              <span className="max-w-full truncate">{t(value)}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ThemeMenu({ choice }: { choice: ThemeChoice }) {
  const t = useTranslations("theme");
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLSpanElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const panelId = useId();
  const Current = icons[choice];

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (event.target instanceof Node && !root.current?.contains(event.target)) setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  return (
    <span
      ref={root}
      className="relative"
      onKeyDown={(event) => {
        if (event.key === "Escape" && open) {
          event.stopPropagation();
          setOpen(false);
          trigger.current?.focus();
        }
      }}
    >
      <button
        ref={trigger}
        type="button"
        aria-label={t("current", { theme: t(choice) })}
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((o) => !o)}
        className="flex size-12 shrink-0 cursor-pointer items-center justify-center rounded-pill border border-border-soft bg-card text-charcoal transition-colors hover:bg-blush"
      >
        <Current className="size-5" strokeWidth={1.75} aria-hidden="true" />
      </button>
      {open && (
        <div
          id={panelId}
          role="group"
          aria-label={t("label")}
          className="absolute end-0 top-full z-50 mt-2 flex w-44 flex-col gap-0.5 segment-group border border-border-soft bg-card p-(--segment-pad) shadow-raised"
        >
          {THEME_CHOICES.map((value) => {
            const Icon = icons[value];
            const active = value === choice;
            return (
              <button
                key={value}
                type="button"
                aria-pressed={active}
                onClick={() => {
                  choose(value);
                  setOpen(false);
                  trigger.current?.focus();
                }}
                className={`flex min-h-11 w-full cursor-pointer items-center gap-2.5 segment-option px-3 text-start text-label-m text-charcoal transition-colors hover:bg-blush ${
                  active ? "bg-tint-coral" : ""
                }`}
              >
                <Icon className="size-5 shrink-0" strokeWidth={1.75} aria-hidden="true" />
                <span className="flex-1">{t(value)}</span>
                {active && <Check className="size-4 shrink-0" strokeWidth={2} aria-hidden="true" />}
              </button>
            );
          })}
        </div>
      )}
    </span>
  );
}
