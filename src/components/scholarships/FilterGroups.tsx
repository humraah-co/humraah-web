import { OptionChip } from "@/components/ui/Chip";
import { FieldSelect, FilterCheckbox } from "@/components/ui/FilterControls";
import type { FieldSummary } from "@/lib/data/public";
import { toggled } from "@/lib/universityFilters";
import {
  scholarshipsHref,
  supportTypes,
  type ScholarshipFilters,
  type SupportType,
} from "@/lib/scholarshipFilters";

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2.5">
      <h3 className="text-label-l">{title}</h3>
      {children}
    </div>
  );
}

/**
 * Filter groups for the Scholarships page (Figma 32:1959): type of support,
 * field of study and "Good to know". Shown in the sidebar on desktop and
 * inside the sheet on phones.
 */
export function ScholarshipFilterGroups({
  filters,
  types,
  fields,
}: {
  filters: ScholarshipFilters;
  /** The types to offer: those with published scholarships, plus any already selected. */
  types: SupportType[];
  fields: FieldSummary[];
}) {
  return (
    <>
      <Group title="Type of support">
        <div className="flex flex-wrap gap-2">
          {supportTypes
            .filter((t) => types.includes(t.value) || filters.types.includes(t.value))
            .map((t) => (
              <OptionChip
                key={t.value}
                href={scholarshipsHref(filters, { types: toggled(filters.types, t.value) })}
                selected={filters.types.includes(t.value)}
              >
                {t.label}
              </OptionChip>
            ))}
        </div>
      </Group>

      {fields.length > 0 && (
        <Group title="Field of study">
          <FieldSelect
            value={filters.field ?? ""}
            allHref={scholarshipsHref(filters, { field: null })}
            options={fields.map((f) => ({
              slug: f.slug,
              name: f.name,
              href: scholarshipsHref(filters, { field: f.slug }),
            }))}
          />
          <p className="text-caption text-muted">Includes scholarships open to any field.</p>
        </Group>
      )}

      <Group title="Good to know">
        <FilterCheckbox
          label="For women"
          checked={filters.women}
          href={scholarshipsHref(filters, { women: !filters.women })}
        />
      </Group>
    </>
  );
}
