"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Award, BookOpen, Compass, House, Landmark, type LucideIcon } from "lucide-react";
import { isAdminPath } from "@/lib/admin/paths";
import { isActive, isQuizPath } from "@/lib/nav";

const tabs: { href: string; label: string; icon: LucideIcon }[] = [
  { href: "/", label: "Home", icon: House },
  { href: "/explore", label: "Explore", icon: Compass },
  { href: "/universities", label: "Universities", icon: Landmark },
  { href: "/scholarships", label: "Scholarships", icon: Award },
  { href: "/guide", label: "Guide", icon: BookOpen },
];

/**
 * Sticky mobile bottom navigation (Figma 4:506). Active tab: pill tint/coral,
 * icon text/deep-rose, label text/charcoal. The spacer keeps the end of the
 * page clear of the bar. Quiz questions have their own sticky button instead, the menu covers the
 * whole screen, and the admin area has its own navigation. Below 400 px the labels lose their
 * letter-spacing and shrink a touch (more below 340 px) so "Universities" and "Scholarships"
 * never touch; every label stays in full.
 */
export function BottomNav() {
  const pathname = usePathname();
  if (pathname === "/quiz" || pathname === "/menu" || isAdminPath(pathname)) return null;
  return (
    <>
      <div aria-hidden="true" className="h-[83px] shrink-0 lg:hidden" />
      <nav
        aria-label="Primary"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-border-soft bg-card px-1.5 pt-2 pb-[max(22px,env(safe-area-inset-bottom))] shadow-bottom-bar max-[399px]:px-1 lg:hidden"
      >
        <ul className="flex">
          {tabs.map(({ href, label, icon: Icon }) => {
            // Quiz results sit under Explore (Figma 12:1222).
            const active = isActive(pathname, href) || (href === "/explore" && isQuizPath(pathname));
            return (
              <li key={href} className="flex-1">
                <Link
                  href={href}
                  aria-current={active ? "page" : undefined}
                  className="flex min-h-11 flex-col items-center gap-1 py-0.5"
                >
                  <span
                    className={`flex items-center justify-center rounded-pill px-4 py-1 ${
                      active ? "bg-tint-coral text-deep-rose" : "text-muted"
                    }`}
                  >
                    <Icon className="size-[22px]" strokeWidth={1.75} aria-hidden="true" />
                  </span>
                  <span
                    className={`text-label-xs whitespace-nowrap max-[399px]:text-[10.5px] max-[399px]:tracking-normal max-[339px]:text-[10px] ${
                      active ? "text-charcoal" : "text-muted"
                    }`}
                  >
                    {label}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </>
  );
}
