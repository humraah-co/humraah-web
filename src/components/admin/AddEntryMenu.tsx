"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { Award, ChevronDown, Landmark, Plus } from "lucide-react";
import { buttonStyles } from "@/components/ui/Button";

const choices = [
  { href: "/admin/universities/new", label: "University", icon: Landmark },
  { href: "/admin/scholarships/new", label: "Scholarship", icon: Award },
];

/**
 * The dashboard's "Add an entry" button and its small menu. A <details>
 * element, so it opens with Enter or Space and works without JavaScript;
 * with it, Escape and clicking elsewhere close it.
 */
export function AddEntryMenu() {
  const ref = useRef<HTMLDetailsElement>(null);

  useEffect(() => {
    const menu = ref.current;
    if (!menu) return;
    const close = (refocus: boolean) => {
      if (!menu.open) return;
      menu.open = false;
      if (refocus) menu.querySelector("summary")?.focus();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close(true);
    };
    const onClick = (e: MouseEvent) => {
      if (!menu.contains(e.target as Node)) close(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("click", onClick);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("click", onClick);
    };
  }, []);

  return (
    <details ref={ref} className="group relative">
      <summary
        className={`${buttonStyles.primary} cursor-pointer list-none [&::-webkit-details-marker]:hidden`}
      >
        <Plus className="size-5" strokeWidth={1.75} aria-hidden="true" />
        Add an entry
        <ChevronDown
          className="size-4 transition-transform group-open:rotate-180"
          strokeWidth={2}
          aria-hidden="true"
        />
      </summary>
      <ul className="absolute right-0 z-20 mt-2 flex w-full min-w-[220px] flex-col gap-1 rounded-2xl border border-border-soft bg-card p-2 shadow-[0_8px_28px_0_rgb(56_51_46/0.1)] sm:w-auto">
        {choices.map(({ href, label, icon: Icon }) => (
          <li key={href}>
            <Link
              href={href}
              className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-label-m text-charcoal hover:bg-cream"
            >
              <Icon className="size-5 shrink-0 text-deep-rose" strokeWidth={1.75} aria-hidden="true" />
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </details>
  );
}
