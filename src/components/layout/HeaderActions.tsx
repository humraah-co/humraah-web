import { Menu, Search } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

const iconButton =
  "flex size-11 shrink-0 items-center justify-center rounded-pill border border-border-soft bg-card text-charcoal transition-colors hover:bg-blush";

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
