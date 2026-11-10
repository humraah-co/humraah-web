import { cardStyles } from "./cardStyles";

/**
 * The short text under a card title: two lines at most, then an ellipsis,
 * clamped by lines (not pixels) so Urdu's taller lines clamp at the same
 * count. Pass englishAttrs(...) for text shown in English on an Urdu page.
 */
export function CardDescription({
  children,
  ...attrs
}: { children: React.ReactNode } & Omit<React.HTMLAttributes<HTMLSpanElement>, "className">) {
  return (
    <span className={cardStyles.description} {...attrs}>
      {children}
    </span>
  );
}
