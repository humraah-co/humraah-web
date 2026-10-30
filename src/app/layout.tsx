/**
 * The real root layouts are app/[locale]/layout.tsx (the public site, one
 * per language) and app/admin/layout.tsx (the team workspace); each renders
 * its own <html>. This one only passes children through, so Next has a
 * top-level layout to render a section's 404 page into ([locale]/not-found).
 * Addresses that match no page use app/global-not-found.tsx.
 *
 * There must be no app/not-found.tsx: Next renders that file inside every
 * request, and its English messages would replace an Urdu page's.
 */
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return children;
}
