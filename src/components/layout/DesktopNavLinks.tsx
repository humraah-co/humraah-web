"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { desktopNav, isActive } from "@/lib/nav";

/** Desktop/Nav links. Current page: text/deep-rose and underlined (Figma 14:284). */
export function DesktopNavLinks() {
  const pathname = usePathname();
  return (
    <ul className="flex items-center gap-7">
      {desktopNav.map((item) => {
        const active = isActive(pathname, item.href);
        return (
          <li key={item.href}>
            <Link
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={
                active
                  ? "text-label-m text-deep-rose underline decoration-2 underline-offset-[6px]"
                  : "text-label-m text-charcoal hover:text-deep-rose"
              }
            >
              {item.label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
