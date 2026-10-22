import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { Container } from "@/components/layout/PageShell";
import { menuNav } from "@/lib/nav";

export const metadata: Metadata = { title: "Menu" };

/** Mobile Menu screen: pages that aren't in the bottom bar. */
export default function MenuPage() {
  return (
    <Container className="py-8">
      <h1 className="text-h1">Menu</h1>
      <ul className="mt-6 divide-y divide-border-soft overflow-hidden rounded-2xl border border-border-soft bg-card">
        {menuNav.map((item) => (
          <li key={item.href}>
            <Link
              href={item.href}
              className="flex min-h-14 items-center justify-between px-5 text-label-l hover:bg-blush"
            >
              {item.label}
              <ChevronRight className="size-5 text-muted" strokeWidth={1.75} aria-hidden="true" />
            </Link>
          </li>
        ))}
      </ul>
    </Container>
  );
}
