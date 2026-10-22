"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";

/**
 * The menu's close (x) button. Goes back to the page the menu was opened
 * from; it's a real link home, so it still works without JavaScript or when
 * the menu was opened directly.
 */
export function MenuClose() {
  const router = useRouter();
  return (
    <Link
      href="/"
      onClick={(event) => {
        const cameFromSite =
          document.referrer.startsWith(window.location.origin) && window.history.length > 1;
        if (cameFromSite) {
          event.preventDefault();
          router.back();
        }
      }}
      className="flex size-11 shrink-0 items-center justify-center rounded-pill border border-border-soft bg-card hover:bg-blush"
      aria-label="Close the menu"
    >
      <X className="size-5" strokeWidth={1.75} aria-hidden="true" />
    </Link>
  );
}
