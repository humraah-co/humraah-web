import { OptionChip } from "@/components/ui/Chip";

export type GuidanceType = "articles" | "resources" | "guides";

/** Where each kind of entry is listed on the combined page; the articles are the default. */
export const guidanceListHref = (type: GuidanceType) =>
  type === "articles" ? "/admin/guidance" : `/admin/guidance?type=${type}`;

/**
 * Switches the "Guidance and resources" page between its tabs: the guidance
 * articles, the resources and the Higher Education Guide PDFs. Plain links,
 * so the choice is in the address and survives a refresh.
 */
export function GuidanceTypeSwitch({
  current,
  counts,
}: {
  current: GuidanceType;
  /** Entries of each kind (for the guides, how many of the two PDFs are up), or null when a list couldn’t be loaded. */
  counts: Record<GuidanceType, number | null>;
}) {
  const options: { type: GuidanceType; label: string }[] = [
    { type: "articles", label: "Guidance articles" },
    { type: "resources", label: "Resources" },
    { type: "guides", label: "Guide PDFs" },
  ];
  return (
    <nav aria-label="Kind of entry" className="flex flex-wrap gap-2">
      {options.map((o) => (
        <OptionChip key={o.type} href={guidanceListHref(o.type)} selected={current === o.type}>
          {o.label}
          <span className="text-muted">{counts[o.type] ?? "–"}</span>
        </OptionChip>
      ))}
    </nav>
  );
}
