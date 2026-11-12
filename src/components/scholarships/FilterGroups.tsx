import { useTranslations } from "next-intl";
import { OptionChip } from "@/components/ui/Chip";
import { FieldSelect, FilterCheckbox } from "@/components/ui/FilterControls";
import { Segmented } from "@/components/ui/Segmented";
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

/** Where the scholarship is for: both, Pakistan or abroad (the "scope" in the address). */
const scopeOptions = [
  { key: "all", scope: null },
  { key: "pakistan", scope: "pakistan" },
  { key: "international", scope: "international" },
] as const satisfies readonly { key: string; scope: ScholarshipFilters["scope"] }[];

/**
 * Filter groups for the Scholarships page (Figma 32:1959): where you'll
 * study, type of support, field of study and "Good to know". Shown in the
 * sidebar on desktop and inside the sheet on phones.
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
  const t = useTranslations("scholarships");
  return (
    <>
      <Group title={t("scopeLabel")}>
        <Segmented
          label={t("scopeLabel")}
          options={scopeOptions.map((o) => ({
            key: o.key,
            label: t(`scope.${o.key}`),
            href: scholarshipsHref(filters, { scope: o.scope }),
            selected: filters.scope === o.scope,
          }))}
        />
      </Group>

      <Group title={t("filterType")}>
        <div className="flex flex-wrap gap-2">
          {supportTypes
            .filter((type) => types.includes(type.value) || filters.types.includes(type.value))
            .map((type) => (
              <OptionChip
                key={type.value}
                href={scholarshipsHref(filters, { types: toggled(filters.types, type.value) })}
                selected={filters.types.includes(type.value)}
              >
                {t(`types.${type.value}`)}
              </OptionChip>
            ))}
        </div>
      </Group>

      {fields.length > 0 && (
        <Group title={t("filterField")}>
          <FieldSelect
            value={filters.field ?? ""}
            allHref={scholarshipsHref(filters, { field: null })}
            options={fields.map((f) => ({
              slug: f.slug,
              name: f.name,
              href: scholarshipsHref(filters, { field: f.slug }),
            }))}
          />
          <p className="text-caption text-muted">{t("anyFieldNote")}</p>
        </Group>
      )}

      <Group title={t("filterGoodToKnow")}>
        <div className="-mt-1 flex flex-col">
          <FilterCheckbox
            label={t("forWomen")}
            checked={filters.women}
            href={scholarshipsHref(filters, { women: !filters.women })}
          />
        </div>
      </Group>
    </>
  );
}
