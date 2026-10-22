"use client";

import { usePathname } from "next/navigation";
import { isQuizPath } from "@/lib/nav";

/** Leaves out the site header and footer on the quiz, which has its own header. */
export function HideOnQuiz({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return isQuizPath(pathname) ? null : <>{children}</>;
}
