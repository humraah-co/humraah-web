import type { Metadata } from "next";
import Link from "next/link";
import { ChevronDown, Search } from "lucide-react";
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
import { pageLocale, type LocaleParams } from "@/i18n/server";

export const metadata: Metadata = {
  title: "Scholarships",
  description:
    "Find scholarships and financial aid for university in Pakistan and abroad: who they're for, what they cover and when they close.",
};

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function ScholarshipsPage({
  params,
  searchParams,
}: {
  params: LocaleParams;
  searchParams: SearchParams;
}) {
  await pageLocale(params);
  const filters = parseScholarshipFilters(await searchParams);
  const [cards, fields] = await Promise.all([listScholarshipCards(), listFields()]);
  const fieldList = fields ?? [];

  const results = cards ? applyScholarshipFilters(cards, filters, fieldList) : [];
  const filterCount = activeScholarshipFilterCount(filters);
  const fieldName = filters.field ? fieldList.find((f) => f.slug === filters.field)?.name : undefined;
  const countLabel = `${results.length} ${results.length === 1 ? "scholarship" : "scholarships"}`;
  const clearHref = scholarshipsHref(filters, { types: [], field: null, women: false });
  const typesOnOffer = supportTypes
    .filter((t) => cards?.some((s) => (t.kinds as readonly string[]).includes(s.kind)))
    .map((t) => t.value);

  const chips = activeChips(filters, fieldName);
  const filterGroups = <ScholarshipFilterGroups filters={filters} types={typesOnOffer} fields={fieldList} />;

  return (
    <>
      <Container className="flex flex-col gap-3.5 pt-6 pb-3 lg:pt-12 lg:pb-8">
        <h1 className="text-h1 lg:text-[40px] lg:leading-[46px]">Find a scholarship</h1>
        <p className="text-body-m text-muted lg:max-w-[760px] lg:text-body-l">
          Don’t assume university is out of reach because of fees. Universities and organisations offer
          support for tuition, living costs, books and more.
        </p>

        <div className="flex flex-col gap-3.5 lg:flex-row lg:items-center lg:gap-4 lg:pt-2">
          <form role="search" action="/scholarships" className="lg:w-[560px]">
            {filters.scope && <input type="hidden" name="scope" value={filters.scope} />}
            {filters.types.map((type) => (
              <input key={type} type="hidden" name="type" value={type} />
            ))}
            {filters.field && <input type="hidden" name="field" value={filters.field} />}
            {filters.women && <input type="hidden" name="women" value="1" />}
            {filters.sort !== "deadline" && <input type="hidden" name="sort" value={filters.sort} />}
            <label htmlFor="scholarship-search" className="sr-only">
              Search scholarships
            </label>
            <span className="flex h-[52px] items-center gap-2.5 rounded-pill border border-border-strong bg-card px-[18px]">
              <Search className="size-5 shrink-0" strokeWidth={1.75} aria-hidden="true" />
              <input
                id="scholarship-search"
                name="q"
                type="search"
                defaultValue={filters.q}
                placeholder="Search scholarships"
                autoComplete="off"
                className="min-w-0 flex-1 bg-transparent text-body-m text-charcoal outline-none placeholder:text-muted"
              />
            </span>
          </form>
          <Segmented
            label="Where you'll study"
            className="lg:w-[420px]"
            options={[
              { key: "all", label: "All", scope: null },
              { key: "pakistan", label: "Pakistan", scope: "pakistan" as const },
              { key: "international", label: "International", scope: "international" as const },
            ].map((o) => ({
              key: o.key,
              label: o.label,
              href: scholarshipsHref(filters, { scope: o.scope }),
              selected: filters.scope === o.scope,
            }))}
          />
        </div>

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
              scholarships.
            </p>
          ) : cards.length === 0 ? (
            <p className="rounded-2xl bg-blush p-5 text-body-m">
              No scholarships are published yet. Check back soon.
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
                  <p className="text-label-l">No scholarships match these filters.</p>
                  <p className="mt-1 text-body-s text-muted">
                    Try removing a filter or searching a different word.{" "}
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
                      Show all scholarships
                    </Link>
                  </p>
                </div>
              ) : (
                <TwoColumns
                  items={results.map((s) => ({ key: s.id, node: <ScholarshipCard scholarship={s} /> }))}
                />
              )}

              <ImportantCallout title="Important">
                Scholarships, eligibility and deadlines change. Always check the provider’s official website
                before you apply.
              </ImportantCallout>
            </>
          )}
        </div>
      </Container>
    </>
  );
}

/** One chip per applied filter, each linking to the list without it. */
function activeChips(filters: ScholarshipFilters, fieldName: string | undefined) {
  const chips: { key: string; label: string; href: string }[] = [];
  for (const t of supportTypes) {
    if (filters.types.includes(t.value)) {
      chips.push({
        key: `type-${t.value}`,
        label: t.label,
        href: scholarshipsHref(filters, { types: toggled(filters.types, t.value) }),
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
    chips.push({ key: "women", label: "For women", href: scholarshipsHref(filters, { women: false }) });
  if (filters.q)
    chips.push({ key: "q", label: `“${filters.q}”`, href: scholarshipsHref(filters, { q: "" }) });
  return chips;
}

function SortMenu({ filters }: { filters: ScholarshipFilters }) {
  const options = [
    { sort: "deadline", label: "closing soon" },
    { sort: "az", label: "A to Z" },
  ] as const;
  const current = options.find((o) => o.sort === filters.sort) ?? options[0];
  return (
    <details key={filters.sort} className="relative">
      <summary className="flex cursor-pointer list-none items-center gap-1 py-2.5 text-label-m text-deep-rose [&::-webkit-details-marker]:hidden">
        Sort: {current.label}
        <ChevronDown className="size-4" strokeWidth={1.75} aria-hidden="true" />
      </summary>
      <ul className="absolute right-0 z-10 mt-1 w-40 rounded-2xl border border-border-soft bg-card p-1.5 shadow-raised">
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
