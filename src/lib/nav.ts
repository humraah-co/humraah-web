/** Site navigation, in the order used by the Figma headers and footers. */

export type NavItem = { href: string; label: string };

export const desktopNav: NavItem[] = [
  { href: "/explore", label: "Explore fields" },
  { href: "/universities", label: "Universities" },
  { href: "/scholarships", label: "Scholarships" },
  { href: "/guidance", label: "Guidance" },
  { href: "/guide", label: "Guide" },
  { href: "/resources", label: "Resources" },
  { href: "/about", label: "About" },
];

export const footerExplore: NavItem[] = [
  { href: "/explore", label: "Explore fields" },
  { href: "/universities", label: "Universities" },
  { href: "/scholarships", label: "Scholarships" },
  { href: "/quiz", label: "Where do I start?" },
];

export const footerHelp: NavItem[] = [
  { href: "/guidance", label: "Guidance" },
  { href: "/guide", label: "Higher Education Guide" },
  { href: "/resources", label: "Resources" },
  { href: "/about", label: "About and contact" },
];

/** Pages reached from the mobile Menu screen (Figma 30:2638) rather than the bottom bar. */
export const menuNav: (NavItem & { description: string })[] = [
  { href: "/guidance", label: "Guidance", description: "Step-by-step help for every stage" },
  { href: "/guide", label: "Higher Education Guide", description: "Free in English and Urdu" },
  { href: "/resources", label: "Resources", description: "Official websites and tools" },
  { href: "/about", label: "About and contact", description: "Who we are and how to reach us" },
  { href: "/quiz", label: "Where do I start?", description: "A two-minute quiz" },
];

export const contact = {
  instagramHandle: "@humraahco",
  instagramUrl: "https://www.instagram.com/humraahco/",
  linkedinLabel: "Humraah",
  email: "humraahco@gmail.com",
};

/** True when `pathname` is `href` or a page inside it (e.g. /universities/qau). */
export function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

/** The quiz has its own header and no site footer (Figma 25:1365, 31:1363). */
export function isQuizPath(pathname: string) {
  return pathname === "/quiz" || pathname.startsWith("/quiz/");
}

/** Pages with their own header instead of the site header and footer: the quiz and the menu (30:2638). */
export function isFocusedPath(pathname: string) {
  return isQuizPath(pathname) || pathname === "/menu";
}
