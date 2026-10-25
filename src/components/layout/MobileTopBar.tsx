"use client";

import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { stripLocale } from "@/i18n/config";
import { ArrowLeft } from "lucide-react";
import { LogoHorizontal } from "@/components/brand/Logo";
import { ShareButton } from "@/components/ui/ShareButton";
import { LanguageSwitch, MenuButton, SearchButton } from "./HeaderActions";

/** Sections whose detail pages (/section/slug) use "App bar/Back" on mobile; values are "nav" labels. */
const detailParents: Record<string, "explore" | "universities" | "scholarships" | "guidance"> = {
  explore: "explore",
  universities: "universities",
  scholarships: "scholarships",
  guidance: "guidance",
};

/**
 * Mobile header. List pages show the "Top bar" (Figma 4:470); detail pages
 * show "App bar/Back" (10:194) with a back link to the list and a share button.
 */
export function MobileTopBar() {
  const pathname = usePathname();
  const t = useTranslations("nav");
  const [section, slug, ...rest] = stripLocale(pathname).split("/").filter(Boolean);
  const parentKey = section ? detailParents[section] : undefined;
  const parentLabel = parentKey ? t(parentKey) : undefined;

  if (parentLabel && slug && rest.length === 0) {
    return (
      <div className="flex items-center gap-1.5 px-3 py-2 lg:hidden">
        <Link
          href={`/${section}`}
          className="flex size-11 shrink-0 items-center justify-center rounded-pill border border-border-soft bg-card hover:bg-blush"
          aria-label={t("backTo", { section: parentLabel })}
        >
          <ArrowLeft className="size-5" strokeWidth={1.75} aria-hidden="true" />
        </Link>
        <p className="flex-1 text-label-l">{parentLabel}</p>
        <ShareButton variant="icon" />
      </div>
    );
  }

  return (
    // gap-3 keeps at least 12 px between the logo and the language switch on the narrowest phones.
    <div className="flex items-center justify-between gap-3 px-4 py-2.5 lg:hidden">
      <LogoHorizontal fit="smallerOnPhones" />
      <div className="flex items-center gap-1 sm:gap-1.5">
        <LanguageSwitch />
        <SearchButton />
        <MenuButton from={stripLocale(pathname)} />
      </div>
    </div>
  );
}
