import { useTranslations } from "next-intl";
import { OptionChip } from "@/components/ui/Chip";
import { FieldSelect, FilterCheckbox } from "@/components/ui/FilterControls";
import type { FieldSummary } from "@/lib/data/public";
import { toggled } from "@/lib/universityFilters";
import {
  scholarshipsHref,
  supportTypes,
  type ScholarshipFilters,
  type ScholarshipProvider,
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
 * Who offers the scholarship: a Pakistani or an international provider (the
 * "scope" column and ?scope= in the address). Not where the student studies:
 * a Scottish scholarship for women at Pakistani universities is International.
 */
const providers = ["pakistan", "international"] as const satisfies readonly ScholarshipProvider[];

/**
 * Filter groups for the Scholarships page (Figma 32:1959): who offers it,
 * type of support, field of study and "Good to know". Shown in the sidebar
 * on desktop and inside the sheet on phones. Who offers it is one choice:
 * picking the other chip switches, picking the chosen one clears it.
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
      <Group title={t("filterProvider")}>
        <div className="flex flex-wrap gap-2">
          {providers.map((provider) => (
            <OptionChip
              key={provider}
              href={scholarshipsHref(filters, { scope: filters.scope === provider ? null : provider })}
              selected={filters.scope === provider}
            >
              {t(`providers.${provider}`)}
            </OptionChip>
          ))}
        </div>
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
