/**
 * English inside Urdu text: a name, email, link, handle or amount. It keeps
 * its left-to-right order and Latin font, and is isolated so the Urdu
 * around it doesn't reorder it (or punctuation next to it). On English
 * pages it changes nothing.
 */
export function Ltr({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span lang="en" dir="ltr" className={className}>
      {children}
    </span>
  );
}
