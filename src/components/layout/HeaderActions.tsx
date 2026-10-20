import Link from "next/link";
import { Menu, Search } from "lucide-react";

const iconButton =
  "flex size-11 shrink-0 items-center justify-center rounded-pill border border-border-soft bg-card text-charcoal transition-colors hover:bg-blush";

/**
 * EN | اردو pill. The Urdu site arrives in week 2, so the Urdu half is shown
 * but not yet a link.
 */
export function LanguageSwitch() {
  return (
    <div
      className="flex h-11 shrink-0 items-center gap-2 rounded-pill border border-border-strong bg-card px-3.5"
      role="group"
      aria-label="Language"
    >
      <span className="text-label-s text-charcoal" aria-current="true">
        EN
      </span>
      <span className="h-3.5 w-px bg-border-strong" aria-hidden="true" />
      <span
        lang="ur"
        dir="rtl"
        className="font-urdu text-[13px] leading-[28px] text-muted"
        title="Urdu version coming soon"
        aria-disabled="true"
      >
        اردو
      </span>
    </div>
  );
}

export function SearchButton() {
  return (
    <Link href="/universities" className={iconButton} aria-label="Search universities">
      <Search className="size-5" strokeWidth={1.75} aria-hidden="true" />
    </Link>
  );
}

export function MenuButton() {
  return (
    <Link href="/menu" className={iconButton} aria-label="Menu">
      <Menu className="size-5" strokeWidth={1.75} aria-hidden="true" />
    </Link>
  );
}
