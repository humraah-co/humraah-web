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

/** Pages reached from the mobile Menu screen rather than the bottom bar. */
export const menuNav: NavItem[] = [
  { href: "/quiz", label: "Where do I start?" },
  { href: "/guidance", label: "Guidance" },
  { href: "/resources", label: "Resources" },
  { href: "/about", label: "About and contact" },
  { href: "/privacy", label: "Privacy and disclaimer" },
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
