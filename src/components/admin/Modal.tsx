"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";

/**
 * Invite modal frame (Figma 36:4440): scrim, card, title and close button.
 * Opened by a URL (e.g. /admin/team?invite=1), so it works without
 * JavaScript; with it, Escape closes it and focus moves inside.
 */
export function Modal({
  title,
  closeHref,
  children,
}: {
  title: string;
  closeHref: string;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // After Next has finished its own focus handling for the navigation.
    const timer = window.setTimeout(() =>
      ref.current?.querySelector<HTMLElement>("input, select, textarea, button[type=submit]")?.focus(),
    );
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") router.push(closeHref, { scroll: false });
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.clearTimeout(timer);
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [closeHref, router]);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4">
      <Link
        href={closeHref}
        scroll={false}
        tabIndex={-1}
        aria-hidden="true"
        className="absolute inset-0 bg-scrim"
      />
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        className="relative flex max-h-[92dvh] w-full flex-col gap-4 overflow-y-auto rounded-t-3xl bg-card p-6 shadow-raised sm:max-w-[480px] sm:rounded-3xl sm:p-8"
      >
        <div className="flex items-center gap-3">
          <h2 id="modal-title" className="flex-1 text-h3">
            {title}
          </h2>
          <Link
            href={closeHref}
            scroll={false}
            className="flex size-11 shrink-0 items-center justify-center rounded-pill border border-border-soft bg-card hover:bg-blush"
            aria-label="Close"
          >
            <X className="size-5" strokeWidth={1.75} aria-hidden="true" />
          </Link>
        </div>
        {children}
      </div>
    </div>
  );
}
