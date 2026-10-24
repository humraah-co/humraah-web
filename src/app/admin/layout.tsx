import type { Metadata } from "next";

// The site header, footer and bottom bar are left out under /admin (see
// isFocusedPath); the sign-in pages and the workspace each add their own.
export const metadata: Metadata = {
  title: { default: "Team workspace", template: "%s · Humraah team" },
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return children;
}
