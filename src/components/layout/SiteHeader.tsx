import { LogoHorizontal } from "@/components/brand/Logo";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { DesktopNavLinks } from "./DesktopNavLinks";
import { SearchButton } from "./HeaderActions";
import { LanguageSwitch } from "./LanguageSwitch";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { MobileTopBar } from "./MobileTopBar";

/**
 * Mobile top bar or back bar (see MobileTopBar) below 1024 px and
 * "Desktop/Nav" (Figma 14:284) from 1024 px up. Below 1280 px the logo
 * shows just its mark and the spacing tightens, so every label fits on
 * one line without the buttons running off the edge.
 */
export function SiteHeader() {
  const t = useTranslations("nav");
  return (
    <header className="sticky top-0 z-40 border-b border-border-soft bg-cream">
      <MobileTopBar />

      {/* Desktop nav */}
      <nav
        aria-label={t("main")}
        className="mx-auto hidden max-w-[1440px] items-center justify-between gap-4 px-6 py-4 lg:flex xl:gap-6 xl:px-20"
      >
        <LogoHorizontal fit="markOnlyBelowXl" />
        <DesktopNavLinks />
        <div className="flex items-center gap-2.5">
          <LanguageSwitch />
          <ThemeToggle />
          <SearchButton />
          <Link
            href="/quiz"
            className="rounded-pill bg-coral px-4 py-2.5 text-label-m whitespace-nowrap text-ink transition-colors hover:bg-coral-hover"
          >
            {t("whereToStart")}
          </Link>
        </div>
      </nav>
    </header>
  );
}
