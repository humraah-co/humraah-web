import { OptionChip } from "@/components/ui/Chip";
import type { FieldSummary } from "@/lib/data/public";
import { hrefWith, toggled, type UniversityFilters } from "@/lib/universityFilters";
import { FieldSelect, FilterCheckbox, MoreOptions } from "./FilterControls";

/** Cities shown before "More cities". */
const VISIBLE_CITIES = 6;

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2.5">
      <h3 className="text-label-l">{title}</h3>
      {children}
    </div>
  );
}

/**
 * The four filter groups from Figma (City, Type of university, Field of study,
 * Good to know). Shown in the sidebar on desktop and inside the sheet on phones.
 */
export function FilterGroups({
  filters,
  cities,
  fields,
}: {
  filters: UniversityFilters;
  cities: string[];
  fields: FieldSummary[];
}) {
  const lower = filters.cities.map((c) => c.toLowerCase());
  const isSelected = (city: string) => lower.includes(city.toLowerCase());
  const cityChip = (city: string) => (
    <OptionChip
      key={city}
      href={hrefWith(filters, {
        cities: isSelected(city)
          ? filters.cities.filter((c) => c.toLowerCase() !== city.toLowerCase())
          : [...filters.cities, city],
      })}
      selected={isSelected(city)}
    >
      {city}
    </OptionChip>
  );

  const shown = cities.slice(0, VISIBLE_CITIES);
  const more = cities.slice(VISIBLE_CITIES);
  const moreSelected = more.some(isSelected);

  return (
    <>
      {cities.length > 0 && (
        <Group title="City">
          <div className="flex flex-wrap gap-2">
            {shown.map(cityChip)}
            {more.length > 0 && (
              <MoreOptions label="More cities" startOpen={moreSelected}>
                {more.map(cityChip)}
              </MoreOptions>
            )}
          </div>
        </Group>
      )}

      <Group title="Type of university">
        <div className="flex flex-wrap gap-2">
          {(["public", "private"] as const).map((type) => (
            <OptionChip
              key={type}
              href={hrefWith(filters, { types: toggled(filters.types, type) })}
              selected={filters.types.includes(type)}
            >
              {type === "public" ? "Public" : "Private"}
            </OptionChip>
          ))}
        </div>
      </Group>

      {fields.length > 0 && (
        <Group title="Field of study">
          <FieldSelect
            value={filters.field ?? ""}
            allHref={hrefWith(filters, { field: null })}
            options={fields.map((f) => ({
              slug: f.slug,
              name: f.name,
              href: hrefWith(filters, { field: f.slug }),
            }))}
          />
        </Group>
      )}

      <Group title="Good to know">
        <FilterCheckbox
          label="Women-only universities"
          checked={filters.women}
          href={hrefWith(filters, { women: !filters.women })}
        />
        <FilterCheckbox
          label="Hostel available for women"
          checked={filters.hostel}
          href={hrefWith(filters, { hostel: !filters.hostel })}
        />
        <FilterCheckbox
          label="Need-based financial aid"
          checked={filters.aid}
          href={hrefWith(filters, { aid: !filters.aid })}
        />
      </Group>
    </>
  );
}
