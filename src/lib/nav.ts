/** Site navigation, in the order used by the Figma headers and footers. */

import { stripLocale } from "@/i18n/config";
import { isAdminPath } from "@/lib/admin/paths";

/** A link in the site navigation; `key` names its label in the "nav" messages. */
export type NavItem = { href: string; key: NavKey };

export type NavKey =
  | "explore"
  | "universities"
  | "scholarships"
  | "guidance"
  | "guide"
  | "guideFull"
  | "resources"
  | "about"
  | "aboutContact"
  | "whereToStart";

export const desktopNav: NavItem[] = [
  { href: "/explore", key: "explore" },
  { href: "/universities", key: "universities" },
  { href: "/scholarships", key: "scholarships" },
  { href: "/guidance", key: "guidance" },
  { href: "/guide", key: "guide" },
  { href: "/resources", key: "resources" },
  { href: "/about", key: "about" },
];

export const footerExplore: NavItem[] = [
  { href: "/explore", key: "explore" },
  { href: "/universities", key: "universities" },
  { href: "/scholarships", key: "scholarships" },
  { href: "/quiz", key: "whereToStart" },
];

export const footerHelp: NavItem[] = [
  { href: "/guidance", key: "guidance" },
  { href: "/guide", key: "guideFull" },
  { href: "/resources", key: "resources" },
  { href: "/about", key: "aboutContact" },
];

/** Pages reached from the mobile Menu screen (Figma 30:2638) rather than the bottom bar; descriptions are in "menu". */
export const menuNav: NavItem[] = [
  { href: "/guidance", key: "guidance" },
  { href: "/guide", key: "guideFull" },
  { href: "/resources", key: "resources" },
  { href: "/about", key: "aboutContact" },
  { href: "/quiz", key: "whereToStart" },
];

export const contact = {
  instagramHandle: "@humraahco",
  instagramUrl: "https://www.instagram.com/humraahco/",
  linkedinLabel: "Humraah",
  email: "humraah.contact@gmail.com",
};

/**
 * True when `pathname` is `href` or a page inside it (e.g. /universities/qau).
 * Works for Urdu addresses too: /ur/universities is active for "/universities".
 */
export function isActive(fullPathname: string, href: string) {
  const pathname = stripLocale(fullPathname);
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

/** The quiz has its own header and no site footer (Figma 25:1365, 31:1363). */
export function isQuizPath(fullPathname: string) {
  const pathname = stripLocale(fullPathname);
  // Exact paths, so a mistyped /quiz/… link gets the normal 404 page with the site header.
  return pathname === "/quiz" || pathname === "/quiz/results";
}

/**
 * Pages with their own header instead of the site header and footer: the
 * quiz, the menu (30:2638) and the admin area, which has its own layout.
 */
export function isFocusedPath(fullPathname: string) {
  const pathname = stripLocale(fullPathname);
  return isQuizPath(pathname) || pathname === "/menu" || isAdminPath(pathname);
}
