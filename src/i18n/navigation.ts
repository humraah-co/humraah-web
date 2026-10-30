import { createNavigation } from "next-intl/navigation";
import { routing } from "./routing.ts";

/** Locale-aware Link and helpers: on an Urdu page, href="/universities" goes to /ur/universities. */
export const { Link, redirect, usePathname, useRouter, getPathname } = createNavigation(routing);
