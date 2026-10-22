"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  Award,
  Compass,
  Globe,
  Landmark,
  LayoutGrid,
  LogOut,
  Menu,
  Users,
  type LucideIcon,
} from "lucide-react";
import { signOut } from "@/app/admin/actions";
import { LogoHorizontal } from "@/components/brand/Logo";
import { Avatar } from "@/components/admin/Workspace";
import { ADMIN_HOME } from "@/lib/admin/paths";
import { roleLabels } from "@/lib/admin/team";
import type { TeamRole } from "@/lib/database.types";
import { isActive } from "@/lib/nav";

const items: { href: string; label: string; icon: LucideIcon }[] = [
  { href: ADMIN_HOME, label: "Dashboard", icon: LayoutGrid },
  { href: "/admin/universities", label: "Universities", icon: Landmark },
  { href: "/admin/scholarships", label: "Scholarships", icon: Award },
  { href: "/admin/resources", label: "Resources", icon: Globe },
  { href: "/admin/fields", label: "Fields of study", icon: Compass },
  { href: "/admin/team", label: "Team", icon: Users },
  { href: "/admin/activity", label: "Activity log", icon: Activity },
];

type Me = { name: string; userId: string; role: TeamRole };

/**
 * Admin/Sidebar (10:316) on desktop. On a phone the same links sit in a
 * menu under a top bar. Team is shown to everyone: researchers see it
 * read-only.
 */
export function AdminNav({ me }: { me: Me }) {
  const pathname = usePathname();
  const links = (
    <ul className="flex flex-col gap-1">
      {items.map(({ href, label, icon: Icon }) => {
        const active = href === ADMIN_HOME ? pathname === ADMIN_HOME : isActive(pathname, href);
        return (
          <li key={href}>
            <Link
              href={href}
              aria-current={active ? "page" : undefined}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-label-m transition-colors ${
                active ? "bg-tint-coral text-charcoal" : "text-muted hover:bg-cream hover:text-charcoal"
              }`}
            >
              <Icon
                className={`size-5 shrink-0 ${active ? "text-deep-rose" : ""}`}
                strokeWidth={1.75}
                aria-hidden="true"
              />
              {label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
  const user = (
    <div className="flex items-center gap-2.5 rounded-[14px] bg-cream p-3">
      <Avatar name={me.name} toneKey={me.userId} tone="bg-lavender" />
      <div className="flex min-w-0 flex-1 flex-col">
        <p className="truncate text-label-m">{me.name}</p>
        <p className="text-caption text-muted">{roleLabels[me.role]}</p>
      </div>
      <form action={signOut}>
        <button
          type="submit"
          className="flex size-11 items-center justify-center rounded-pill hover:bg-blush"
          aria-label="Sign out"
          title="Sign out"
        >
          <LogOut className="size-5" strokeWidth={1.75} aria-hidden="true" />
        </button>
      </form>
    </div>
  );
  const brand = (
    <div className="flex flex-col gap-1.5">
      <LogoHorizontal href={ADMIN_HOME} />
      <p className="text-caption text-muted">Team workspace</p>
    </div>
  );

  return (
    <>
      <aside className="sticky top-0 hidden h-dvh w-[264px] shrink-0 flex-col gap-1 overflow-y-auto border-r border-border-soft bg-card px-4 py-6 lg:flex">
        <div className="px-3 pb-5">{brand}</div>
        <nav aria-label="Workspace">{links}</nav>
        <div className="flex-1" />
        {user}
      </aside>

      <header className="sticky top-0 z-30 border-b border-border-soft bg-card lg:hidden">
        {/* A new key closes the menu after each navigation. */}
        <details key={pathname} className="group">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-2.5 [&::-webkit-details-marker]:hidden">
            {brand}
            <span className="flex size-11 items-center justify-center rounded-pill border border-border-soft group-open:bg-blush">
              <Menu className="size-5" strokeWidth={1.75} aria-hidden="true" />
              <span className="sr-only">Workspace menu</span>
            </span>
          </summary>
          <div className="flex flex-col gap-3 border-t border-border-soft px-4 pt-3 pb-4">
            <nav aria-label="Workspace">{links}</nav>
            {user}
          </div>
        </details>
      </header>
    </>
  );
}
