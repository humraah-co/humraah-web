import type { Metadata } from "next";
import { ChevronDown, Search } from "lucide-react";
import { useTranslations } from "next-intl";
import { getTranslations } from "next-intl/server";
import { ScholarshipCard } from "@/components/content/Cards";
import { Container } from "@/components/layout/PageShell";
import { TwoColumns } from "@/components/layout/TwoColumns";
import { ScholarshipFilterGroups } from "@/components/scholarships/FilterGroups";
import { ImportantCallout } from "@/components/ui/Blocks";
import { ActiveFilterChip } from "@/components/ui/Chip";
import { FilterSheet } from "@/components/ui/FilterControls";
import { Segmented } from "@/components/ui/Segmented";
import { listFields, listScholarshipCards } from "@/lib/data/public";
import {
  activeScholarshipFilterCount,
  applyScholarshipFilters,
  parseScholarshipFilters,
  scholarshipsHref,
  supportTypes,
  type ScholarshipFilters,
} from "@/lib/scholarshipFilters";
import { toggled } from "@/lib/universityFilters";
import { localizedPath } from "@/i18n/config";
import { Link } from "@/i18n/navigation";
import { alternates } from "@/i18n/metadata";
import { pageLocale, type LocaleParams } from "@/i18n/server";

export async function generateMetadata({ params }: { params: LocaleParams }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "scholarships" });
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    alternates: alternates("/scholarships", locale),
  };
}

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function ScholarshipsPage({
  params,
  searchParams,
}: {
  params: LocaleParams;
  searchParams: SearchParams;
}) {
  const locale = await pageLocale(params);
  const t = await getTranslations("scholarships");
  const filters = parseScholarshipFilters(await searchParams);
  const [cards, fields] = await Promise.all([listScholarshipCards(locale), listFields(locale)]);
  const fieldList = fields ?? [];

  const results = cards ? applyScholarshipFilters(cards, filters, fieldList) : [];
  const filterCount = activeScholarshipFilterCount(filters);
  const fieldName = filters.field ? fieldList.find((f) => f.slug === filters.field)?.name : undefined;
  const countLabel = t("count", { count: results.length });
  const clearHref = scholarshipsHref(filters, { types: [], field: null, women: false });
  const typesOnOffer = supportTypes
    .filter((type) => cards?.some((s) => (type.kinds as readonly string[]).includes(s.kind)))
    .map((type) => type.value);

  const chips = activeChips(filters, fieldName, t);
  const filterGroups = <ScholarshipFilterGroups filters={filters} types={typesOnOffer} fields={fieldList} />;

  return (
    <>
      <Container className="flex flex-col gap-3.5 pt-6 pb-3 lg:pt-12 lg:pb-8">
        <h1 className="text-h1 lg:text-[40px] lg:leading-[46px]">{t("title")}</h1>
        <p className="text-body-m text-muted lg:max-w-[760px] lg:text-body-l">{t("intro")}</p>

        <div className="flex flex-col gap-3.5 lg:flex-row lg:items-center lg:gap-4 lg:pt-2">
          <form role="search" action={localizedPath("/scholarships", locale)} className="lg:w-[560px]">
            {filters.scope && <input type="hidden" name="scope" value={filters.scope} />}
            {filters.types.map((type) => (
              <input key={type} type="hidden" name="type" value={type} />
            ))}
            {filters.field && <input type="hidden" name="field" value={filters.field} />}
            {filters.women && <input type="hidden" name="women" value="1" />}
            {filters.sort !== "deadline" && <input type="hidden" name="sort" value={filters.sort} />}
            <label htmlFor="scholarship-search" className="sr-only">
              {t("search")}
            </label>
            <span className="flex h-[52px] items-center gap-2.5 rounded-pill border border-border-strong bg-card px-[18px]">
              <Search className="size-5 shrink-0" strokeWidth={1.75} aria-hidden="true" />
              <input
                id="scholarship-search"
                name="q"
                type="search"
                defaultValue={filters.q}
                placeholder={t("search")}
                autoComplete="off"
                className="min-w-0 flex-1 bg-transparent text-body-m text-charcoal outline-none placeholder:text-muted"
              />
            </span>
          </form>
          <Segmented
            label={t("scopeLabel")}
            className="lg:w-[420px]"
            options={[
              { key: "all", scope: null },
              { key: "pakistan", scope: "pakistan" as const },
              { key: "international", scope: "international" as const },
            ].map((o) => ({
              key: o.key,
              label: t(`scope.${o.key}`),
              href: scholarshipsHref(filters, { scope: o.scope }),
              selected: filters.scope === o.scope,
            }))}
          />
        </div>

        {cards && (
          <div className="flex flex-wrap items-center gap-2 lg:hidden">
            <FilterSheet
              count={filterCount}
              showLabel={t("show", { count: results.length })}
              clearHref={clearHref}
            >
              <div className="flex flex-col gap-[22px]">{filterGroups}</div>
            </FilterSheet>
            {chips.map((chip) => (
              <ActiveFilterChip key={chip.key} href={chip.href}>
                {chip.label}
              </ActiveFilterChip>
            ))}
          </div>
        )}
      </Container>

      <Container className="pb-7 lg:flex lg:items-start lg:gap-8 lg:pb-16">
        {cards && (
          <aside
            aria-label={t("filters")}
            className="hidden w-[300px] shrink-0 flex-col gap-[22px] rounded-3xl border border-border-soft bg-card p-6 lg:flex"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-h3">{t("filters")}</h2>
              <Link
                href={clearHref}
                scroll={false}
                className="py-2.5 text-label-m text-deep-rose underline underline-offset-2 hover:text-charcoal"
              >
                {t("clearAll")}
              </Link>
            </div>
            {filterGroups}
          </aside>
        )}

        <div className="flex min-w-0 flex-1 flex-col gap-3 lg:gap-4">
          {cards === null ? (
            <p className="rounded-2xl bg-tint-lavender p-5 text-body-m" role="status">
              {t("notConnected")}
            </p>
          ) : cards.length === 0 ? (
            <p className="rounded-2xl bg-blush p-5 text-body-m">{t("noScholarships")}</p>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <p className="text-label-m lg:text-label-l" role="status">
                  {countLabel}
                </p>
                <SortMenu filters={filters} />
              </div>

              {chips.length > 0 && (
                <div className="hidden flex-wrap gap-2 lg:flex">
                  {chips.map((chip) => (
                    <ActiveFilterChip key={chip.key} href={chip.href}>
                      {chip.label}
                    </ActiveFilterChip>
                  ))}
                </div>
              )}

              {results.length === 0 ? (
                <div className="rounded-2xl bg-blush p-5">
                  <p className="text-label-l">{t("noMatch")}</p>
                  <p className="mt-1 text-body-s text-muted">
                    {t("noMatchHint")}{" "}
                    <Link
                      href={scholarshipsHref(filters, {
                        q: "",
                        scope: null,
                        types: [],
                        field: null,
                        women: false,
                      })}
                      className="text-deep-rose underline underline-offset-2 hover:text-charcoal"
                    >
                      {t("showAll")}
                    </Link>
                  </p>
                </div>
              ) : (
                <TwoColumns
                  items={results.map((s) => ({ key: s.id, node: <ScholarshipCard scholarship={s} /> }))}
                />
              )}

              <ImportantCallout title={t("importantTitle")}>{t("importantText")}</ImportantCallout>
            </>
          )}
        </div>
      </Container>
    </>
  );
}

/** One chip per applied filter, each linking to the list without it. `t` is the "scholarships" messages. */
function activeChips(
  filters: ScholarshipFilters,
  fieldName: string | undefined,
  t: Awaited<ReturnType<typeof getTranslations<"scholarships">>>,
) {
  const chips: { key: string; label: string; href: string }[] = [];
  for (const type of supportTypes) {
    if (filters.types.includes(type.value)) {
      chips.push({
        key: `type-${type.value}`,
        label: t(`types.${type.value}`),
        href: scholarshipsHref(filters, { types: toggled(filters.types, type.value) }),
      });
    }
  }
  if (filters.field)
    chips.push({
      key: "field",
      label: fieldName ?? filters.field,
      href: scholarshipsHref(filters, { field: null }),
    });
  if (filters.women)
    chips.push({ key: "women", label: t("forWomen"), href: scholarshipsHref(filters, { women: false }) });
  if (filters.q)
    chips.push({
      key: "q",
      label: t("chipQuery", { query: filters.q }),
      href: scholarshipsHref(filters, { q: "" }),
    });
  return chips;
}

function SortMenu({ filters }: { filters: ScholarshipFilters }) {
  const t = useTranslations("scholarships");
  const options = [
    { sort: "deadline", label: t("sortDeadline") },
    { sort: "az", label: t("sortAz") },
  ] as const;
  const current = options.find((o) => o.sort === filters.sort) ?? options[0];
  return (
    <details key={filters.sort} className="relative">
      <summary className="flex cursor-pointer list-none items-center gap-1 py-2.5 text-label-m text-deep-rose [&::-webkit-details-marker]:hidden">
        {t("sort", { order: current.label })}
        <ChevronDown className="size-4" strokeWidth={1.75} aria-hidden="true" />
      </summary>
      <ul className="absolute end-0 z-10 mt-1 w-40 rounded-2xl border border-border-soft bg-card p-1.5 shadow-raised">
        {options.map((o) => (
          <li key={o.sort}>
            <Link
              href={scholarshipsHref(filters, { sort: o.sort })}
              scroll={false}
              aria-current={o.sort === filters.sort ? "true" : undefined}
              className="block rounded-xl px-3 py-2 text-label-m first-letter:uppercase hover:bg-blush aria-[current=true]:bg-tint-coral"
            >
              {o.label}
            </Link>
          </li>
        ))}
      </ul>
    </details>
  );
}
