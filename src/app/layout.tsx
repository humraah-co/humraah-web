/**
 * The real root layouts are app/[locale]/layout.tsx (the public site, one
 * per language) and app/admin/layout.tsx (the team workspace); each renders
 * its own <html>. This one only passes children through, so Next has a
 * top-level layout to render 404 pages into.
 */
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return children;
}
