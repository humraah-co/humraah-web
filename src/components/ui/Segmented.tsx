import { Link } from "@/i18n/navigation";

/**
 * Segmented (Figma 4:176): one choice from a few. Each segment is a link, so
 * the choice lives in the page address and works without JavaScript.
 */
export function Segmented({
  label,
  options,
  className = "",
}: {
  /** Names the group for screen readers. */
  label: string;
  options: { key: string; label: string; href: string; selected: boolean }[];
  className?: string;
}) {
  return (
    <nav aria-label={label} className={`flex gap-1 rounded-pill bg-blush p-1 ${className}`}>
      {options.map((o) => (
        <Link
          key={o.key}
          href={o.href}
          scroll={false}
          aria-current={o.selected ? "true" : undefined}
          className={`flex min-w-0 flex-1 items-center justify-center rounded-pill px-2 py-2.5 text-label-m whitespace-nowrap transition-colors ${
            o.selected ? "bg-card text-charcoal" : "text-muted hover:text-charcoal"
          }`}
        >
          {o.label}
        </Link>
      ))}
    </nav>
  );
}
