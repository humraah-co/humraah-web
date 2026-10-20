import Link from "next/link";
import { LogoHorizontal } from "@/components/brand/Logo";
import { DesktopNavLinks } from "./DesktopNavLinks";
import { LanguageSwitch, MenuButton, SearchButton } from "./HeaderActions";

/**
 * Mobile "Top bar" (Figma 4:470) below 1024 px and "Desktop/Nav" (14:284)
 * from 1024 px up.
 */
export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border-soft bg-cream">
      {/* Mobile top bar */}
      <div className="flex items-center justify-between px-4 py-2.5 lg:hidden">
        <LogoHorizontal />
        <div className="flex items-center gap-1.5">
          <LanguageSwitch />
          <SearchButton />
          <MenuButton />
        </div>
      </div>

      {/* Desktop nav */}
      <nav
        aria-label="Main"
        className="mx-auto hidden max-w-[1440px] items-center justify-between gap-6 px-10 py-4 lg:flex xl:px-20"
      >
        <LogoHorizontal />
        <DesktopNavLinks />
        <div className="flex items-center gap-2.5">
          <LanguageSwitch />
          <SearchButton />
          <Link
            href="/quiz"
            className="rounded-pill bg-coral px-4 py-2.5 text-label-m whitespace-nowrap text-charcoal transition-colors hover:bg-[#e2807f]"
          >
            Where do I start?
          </Link>
        </div>
      </nav>
    </header>
  );
}
