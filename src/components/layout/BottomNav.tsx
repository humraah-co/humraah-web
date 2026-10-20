"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Award, BookOpen, Compass, House, Landmark, type LucideIcon } from "lucide-react";
import { isActive } from "@/lib/nav";

const tabs: { href: string; label: string; icon: LucideIcon }[] = [
  { href: "/", label: "Home", icon: House },
  { href: "/explore", label: "Explore", icon: Compass },
  { href: "/universities", label: "Universities", icon: Landmark },
  { href: "/scholarships", label: "Scholarships", icon: Award },
  { href: "/guide", label: "Guide", icon: BookOpen },
];

/**
 * Sticky mobile bottom navigation (Figma 4:506). Active tab: pill tint/coral,
 * icon text/deep-rose, label text/charcoal.
 */
export function BottomNav() {
  const pathname = usePathname();
  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border-soft bg-card px-1.5 pt-2 pb-[max(22px,env(safe-area-inset-bottom))] shadow-bottom-bar lg:hidden"
    >
      <ul className="flex">
        {tabs.map(({ href, label, icon: Icon }) => {
          const active = isActive(pathname, href);
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
                <span className={`text-label-xs ${active ? "text-charcoal" : "text-muted"}`}>{label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
