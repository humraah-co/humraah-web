"use client";

import { usePathname } from "next/navigation";
import { isFocusedPath } from "@/lib/nav";

/** Leaves out the site header and footer on pages with their own header: the quiz and the menu. */
export function HideOnFocusedPages({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return isFocusedPath(pathname) ? null : <>{children}</>;
}
