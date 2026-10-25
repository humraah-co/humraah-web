import { Menu, Search } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

const iconButton =
  "flex size-11 shrink-0 items-center justify-center rounded-pill border border-border-soft bg-card text-charcoal transition-colors hover:bg-blush";

/**
 * EN | اردو pill. The Urdu site arrives in week 2, so the Urdu half is shown
 * but not yet a link. A little narrower below 360 px, to fit the phone top bar.
 */
export function LanguageSwitch() {
  const t = useTranslations("language");
  return (
    <div
      className="flex h-11 shrink-0 items-center gap-2 rounded-pill border border-border-strong bg-card px-3.5 max-[360px]:px-3"
      role="group"
      aria-label={t("label")}
    >
      <span className="text-label-s text-charcoal" aria-current="true">
        EN
      </span>
      <span className="h-3.5 w-px bg-border-strong" aria-hidden="true" />
      <span
        lang="ur"
        dir="rtl"
        className="font-urdu text-[13px] leading-[28px] text-muted"
        title={t("comingSoon")}
        aria-disabled="true"
      >
        اردو
      </span>
    </div>
  );
}

export function SearchButton() {
  const t = useTranslations("nav");
  return (
    <Link href="/universities" className={iconButton} aria-label={t("searchUniversities")}>
      <Search className="size-5" strokeWidth={1.75} aria-hidden="true" />
    </Link>
  );
}

/** Opens the Menu screen; `from` is the current page, so closing the menu returns to it. */
export function MenuButton({ from }: { from: string }) {
  const t = useTranslations("nav");
  const href = from === "/" ? "/menu" : `/menu?from=${encodeURIComponent(from)}`;
  return (
    <Link href={href} className={iconButton} aria-label={t("menu")}>
      <Menu className="size-5" strokeWidth={1.75} aria-hidden="true" />
    </Link>
  );
}
