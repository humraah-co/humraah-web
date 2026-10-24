import type { Metadata } from "next";
import Link from "next/link";
import { ChevronDown, Search } from "lucide-react";
import { UniversityCard } from "@/components/content/Cards";
import { Container } from "@/components/layout/PageShell";
import { TwoColumns } from "@/components/layout/TwoColumns";
import { ImportantCallout } from "@/components/ui/Blocks";
import { buttonStyles } from "@/components/ui/Button";
import { ActiveFilterChip } from "@/components/ui/Chip";
import { FilterGroups } from "@/components/universities/FilterGroups";
import { FilterSheet } from "@/components/ui/FilterControls";
import { listFields, listUniversityCards } from "@/lib/data/public";
import {
  activeFilterCount,
  applyFilters,
  cityOptions,
  hrefWith,
  PAGE_SIZE,
  parseFilters,
  toggled,
  type UniversityFilters,
} from "@/lib/universityFilters";

export const metadata: Metadata = {
  title: "Universities",
  description: "Find universities in Pakistan, then see their programmes, fees and how to apply.",
};

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function UniversitiesPage({ searchParams }: { searchParams: SearchParams }) {
  const filters = parseFilters(await searchParams);
  const [cards, fields] = await Promise.all([listUniversityCards(), listFields()]);
  const fieldList = fields ?? [];

  const results = cards ? applyFilters(cards, filters, fieldList) : [];
  const visible = results.slice(0, filters.limit);
  const filterCount = activeFilterCount(filters);
  const fieldName = filters.field ? fieldList.find((f) => f.slug === filters.field)?.name : undefined;
  const fieldId = filters.field ? fieldList.find((f) => f.slug === filters.field)?.id : undefined;
  const countLabel = `${results.length} ${results.length === 1 ? "university" : "universities"}`;
  const clearHref = hrefWith(filters, {
    cities: [],
    types: [],
    field: null,
    women: false,
    hostel: false,
    aid: false,
  });

  const chips = activeChips(filters, fieldName);
  const filterGroups = (
    <FilterGroups filters={filters} cities={cards ? cityOptions(cards) : []} fields={fieldList} />
  );

  return (
    <>
      <Container className="flex flex-col gap-3.5 pt-6 pb-3 lg:pt-12 lg:pb-8">
        <h1 className="text-h1 lg:text-[40px] lg:leading-[46px]">Find a university</h1>
        <p className="text-body-m text-muted lg:max-w-[720px] lg:text-body-l">
          Every university listed is recognised by HEC. Open one to see programmes, fees and how to apply.
        </p>

        <form role="search" action="/universities" className="flex items-center gap-3 lg:pt-2">
          {filters.cities.map((city) => (
            <input key={city} type="hidden" name="city" value={city} />
          ))}
          {filters.types.map((type) => (
            <input key={type} type="hidden" name="type" value={type} />
          ))}
          {filters.field && <input type="hidden" name="field" value={filters.field} />}
          {filters.women && <input type="hidden" name="women" value="1" />}
          {filters.hostel && <input type="hidden" name="hostel" value="1" />}
          {filters.aid && <input type="hidden" name="aid" value="1" />}
          {filters.sort !== "az" && <input type="hidden" name="sort" value={filters.sort} />}
          <label htmlFor="university-search" className="sr-only">
            Search by name, city or subject
          </label>
          <span className="flex h-[52px] flex-1 items-center gap-2.5 rounded-pill border border-border-strong bg-card px-[18px] lg:max-w-[560px]">
            <Search className="size-5 shrink-0" strokeWidth={1.75} aria-hidden="true" />
            <input
              id="university-search"
              name="q"
              type="search"
              defaultValue={filters.q}
              placeholder="Search by name, city or subject"
              autoComplete="off"
              className="min-w-0 flex-1 bg-transparent text-body-m text-charcoal outline-none placeholder:text-muted"
            />
          </span>
          <span className="hidden lg:block">
            <button type="submit" className={buttonStyles.primary}>
              Search
            </button>
          </span>
        </form>

        {cards && (
          <div className="flex flex-wrap items-center gap-2 lg:hidden">
            <FilterSheet count={filterCount} showLabel={`Show ${countLabel}`} clearHref={clearHref}>
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
            aria-label="Filters"
            className="hidden w-[300px] shrink-0 flex-col gap-[22px] rounded-3xl border border-border-soft bg-card p-6 lg:flex"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-h3">Filters</h2>
              <Link
                href={clearHref}
                scroll={false}
                className="py-2.5 text-label-m text-deep-rose underline underline-offset-2 hover:text-charcoal"
              >
                Clear all
              </Link>
            </div>
            {filterGroups}
          </aside>
        )}

        <div className="flex min-w-0 flex-1 flex-col gap-3 lg:gap-4">
          {cards === null ? (
            <p className="rounded-2xl bg-tint-lavender p-5 text-body-m" role="status">
              The database isn&apos;t connected yet. Add the Supabase environment variables to see
              universities.
            </p>
          ) : cards.length === 0 ? (
            <p className="rounded-2xl bg-blush p-5 text-body-m">
              No universities are published yet. Check back soon.
            </p>
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
                  <p className="text-label-l">No universities match these filters.</p>
                  <p className="mt-1 text-body-s text-muted">
                    Try removing a filter or searching a different word.{" "}
                    <Link
                      href={hrefWith(filters, {
                        q: "",
                        cities: [],
                        types: [],
                        field: null,
                        women: false,
                        hostel: false,
                        aid: false,
                      })}
                      className="text-deep-rose underline underline-offset-2 hover:text-charcoal"
                    >
                      Show all universities
                    </Link>
                  </p>
                </div>
              ) : (
                <TwoColumns
                  items={visible.map((u) => ({
                    key: u.id,
                    node: <UniversityCard university={u} fieldId={fieldId} />,
                  }))}
                  extra={<CampusNote />}
                />
              )}

              {results.length > visible.length && (
                <div className="flex justify-center lg:pt-2">
                  <Link
                    href={hrefWith(filters, { limit: filters.limit + PAGE_SIZE })}
                    scroll={false}
                    className={`${buttonStyles.secondary} w-full lg:w-auto`}
                  >
                    Show more universities
                  </Link>
                </div>
              )}

              <div className="lg:hidden">
                <CampusNote />
              </div>
            </>
          )}
        </div>
      </Container>
    </>
  );
}

function CampusNote() {
  return (
    <ImportantCallout title="Check the exact campus">
      Always check that the campus you’re applying to is on HEC’s recognised list before you apply.
    </ImportantCallout>
  );
}

/** One chip per applied filter, each linking to the list without it. */
function activeChips(filters: UniversityFilters, fieldName: string | undefined) {
  const chips: { key: string; label: string; href: string }[] = [];
  for (const city of filters.cities) {
    chips.push({
      key: `city-${city}`,
      label: city,
      href: hrefWith(filters, { cities: toggled(filters.cities, city) }),
    });
  }
  for (const type of filters.types) {
    chips.push({
      key: `type-${type}`,
      label: type === "public" ? "Public" : "Private",
      href: hrefWith(filters, { types: toggled(filters.types, type) }),
    });
  }
  if (filters.field)
    chips.push({ key: "field", label: fieldName ?? filters.field, href: hrefWith(filters, { field: null }) });
  if (filters.women)
    chips.push({ key: "women", label: "Women only", href: hrefWith(filters, { women: false }) });
  if (filters.hostel)
    chips.push({ key: "hostel", label: "Hostel for women", href: hrefWith(filters, { hostel: false }) });
  if (filters.aid)
    chips.push({ key: "aid", label: "Need-based aid", href: hrefWith(filters, { aid: false }) });
  if (filters.q) chips.push({ key: "q", label: `“${filters.q}”`, href: hrefWith(filters, { q: "" }) });
  return chips;
}

function SortMenu({ filters }: { filters: UniversityFilters }) {
  const options = [
    { sort: "az", label: "A to Z" },
    { sort: "za", label: "Z to A" },
  ] as const;
  const current = options.find((o) => o.sort === filters.sort) ?? options[0];
  return (
    <details key={filters.sort} className="relative">
      <summary className="flex cursor-pointer list-none items-center gap-1 py-2.5 text-label-m text-deep-rose [&::-webkit-details-marker]:hidden">
        Sort: {current.label}
        <ChevronDown className="size-4" strokeWidth={1.75} aria-hidden="true" />
      </summary>
      <ul className="absolute right-0 z-10 mt-1 w-36 rounded-2xl border border-border-soft bg-card p-1.5 shadow-raised">
        {options.map((o) => (
          <li key={o.sort}>
            <Link
              href={hrefWith(filters, { sort: o.sort })}
              scroll={false}
              aria-current={o.sort === filters.sort ? "true" : undefined}
              className="block rounded-xl px-3 py-2 text-label-m hover:bg-blush aria-[current=true]:bg-tint-coral"
            >
              {o.label}
            </Link>
          </li>
        ))}
      </ul>
    </details>
  );
}
