"use client";

import { Moon } from "lucide-react";
import { useSyncExternalStore } from "react";
import { useTranslations } from "next-intl";
import { THEME_ATTRIBUTE, THEME_COLORS, THEME_STORAGE_KEY, type Theme } from "@/lib/theme/script";

function read(): Theme {
  return document.documentElement.getAttribute(THEME_ATTRIBUTE) === "dark" ? "dark" : "light";
}

const listeners = new Set<() => void>();

function subscribe(onChange: () => void) {
  listeners.add(onChange);
  // Another tab changed the choice: follow it.
  const onStorage = (event: StorageEvent) => {
    if (event.key !== THEME_STORAGE_KEY) return;
    apply(event.newValue === "dark" ? "dark" : "light");
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(onChange);
    window.removeEventListener("storage", onStorage);
  };
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

function toggle(current: Theme) {
  const next: Theme = current === "dark" ? "light" : "dark";
  fade();
  apply(next);
  try {
    localStorage.setItem(THEME_STORAGE_KEY, next);
  } catch {
    // Storage blocked: the choice still applies to this page, it just isn't remembered.
  }
}

/**
 * Light/dark switch. `icon` is a 48 px round button for the header and the
 * workspace; `row` is the full-width line on the Menu screen. The label
 * stays "Dark mode" and aria-pressed says whether it is on, so a screen
 * reader hears "Dark mode, toggle button, pressed".
 */
export function ThemeToggle({ variant = "icon" }: { variant?: "icon" | "row" }) {
  const t = useTranslations("theme");
  // The server renders light; the script may already have set dark, so the real value is read after hydration.
  const theme = useSyncExternalStore(subscribe, read, () => "light" as Theme);
  const pressed = theme === "dark";
  const icon = (
    <Moon className="size-5" strokeWidth={1.75} fill={pressed ? "currentColor" : "none"} aria-hidden="true" />
  );

  if (variant === "row") {
    return (
      <button
        type="button"
        aria-pressed={pressed}
        onClick={() => toggle(theme)}
        className="flex min-h-12 w-full cursor-pointer items-center gap-3.5 rounded-pill border border-border-soft bg-card px-3 text-start text-label-l text-charcoal hover:bg-blush"
      >
        <span
          className={`flex size-9 shrink-0 items-center justify-center rounded-pill ${pressed ? "bg-tint-coral text-deep-rose" : "bg-blush"}`}
        >
          {icon}
        </span>
        <span className="flex-1">{t("darkMode")}</span>
        <span
          aria-hidden="true"
          className={`flex h-6 w-11 shrink-0 items-center rounded-pill border border-border-strong px-0.5 ${pressed ? "bg-tint-coral" : "bg-cream"}`}
        >
          <span
            className={`size-4 rounded-pill transition-transform ${pressed ? "translate-x-5 bg-deep-rose rtl:-translate-x-5" : "bg-muted"}`}
          />
        </span>
      </button>
    );
  }

  return (
    <button
      type="button"
      aria-label={t("darkMode")}
      aria-pressed={pressed}
      onClick={() => toggle(theme)}
      className={`flex size-12 shrink-0 cursor-pointer items-center justify-center rounded-pill border text-charcoal transition-colors hover:bg-blush ${
        pressed ? "border-deep-rose bg-tint-coral" : "border-border-soft bg-card"
      }`}
    >
      {icon}
    </button>
  );
}
