import type { Metadata } from "next";
import { Search } from "lucide-react";
import { FieldCard } from "@/components/content/Cards";
import { Container } from "@/components/layout/PageShell";
import { TwoColumns } from "@/components/layout/TwoColumns";
import { RememberCallout } from "@/components/ui/Blocks";
import { buttonStyles } from "@/components/ui/Button";
import { listFields, type FieldSummary } from "@/lib/data/public";
import { countWord } from "@/lib/format";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Explore fields of study",
  description: "Browse popular fields of study in Pakistan and what you might enjoy in each.",
};

/** Case-insensitive match on the field name, summary, interests and example programmes. */
function matches(field: FieldSummary, query: string) {
  const haystack = [
    field.name,
    field.summary,
    field.you_might_enjoy,
    ...field.interests,
    ...field.example_programmes,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return query
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .every((word) => haystack.includes(word));
}

export default async function ExplorePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string | string[] }>;
}) {
  const { q } = await searchParams;
  const query = (Array.isArray(q) ? q[0] : q)?.trim() ?? "";

  const fields = await listFields();
  const shown = fields && query ? fields.filter((f) => matches(f, query)) : fields;

  return (
    <>
      {/* The quiz box sits beside the heading from 1280 px; below that it runs full width underneath. */}
      <Container className="flex flex-col gap-3 pt-6 pb-2 lg:gap-6 lg:pt-12 lg:pb-8 xl:flex-row xl:items-end xl:gap-12">
        <div className="flex flex-col gap-3 lg:gap-3.5 xl:flex-1">
          <h1 className="text-h1 lg:text-[40px] lg:leading-[46px]">What could you study?</h1>
          <p className="max-w-[640px] text-body-m text-muted lg:text-body-l">
            There are so many fields to explore.
            {fields && fields.length > 0
              ? ` Here are ${countWord(fields.length)} popular areas and what you might enjoy in each.`
              : " Check back soon for popular areas and what you might enjoy in each."}
          </p>
          <form role="search" action="/explore" className="w-full lg:w-[560px]">
            <label htmlFor="field-search" className="sr-only">
              Search fields or programmes
            </label>
            <span className="flex h-[52px] items-center gap-2.5 rounded-pill border border-border-strong bg-card px-[18px]">
              <Search className="size-5 shrink-0" strokeWidth={1.75} aria-hidden="true" />
              <input
                id="field-search"
                name="q"
                type="search"
                defaultValue={query}
                placeholder="Search fields or programmes"
                autoComplete="off"
                className="min-w-0 flex-1 bg-transparent text-body-m text-charcoal outline-none placeholder:text-muted"
              />
            </span>
          </form>
        </div>

        <aside className="flex items-center gap-3 rounded-[20px] bg-lavender p-4 lg:gap-6 lg:rounded-3xl lg:p-6 xl:w-[420px] xl:shrink-0 xl:flex-col xl:items-start xl:gap-2.5">
          <div className="flex min-w-0 flex-1 flex-col gap-0.5 lg:gap-1.5 xl:flex-none xl:gap-2.5">
            <p className="text-script">Not sure where to begin?</p>
            <p className="text-body-s lg:text-body-m">
              Take a two-minute quiz and we’ll suggest a few fields
              <span className="hidden lg:inline"> to explore</span>.
            </p>
          </div>
          <Link href="/quiz" className={`${buttonStyles.small} shrink-0`}>
            Take the quiz
          </Link>
        </aside>
      </Container>

      <Container className="pt-3 pb-2 lg:pt-2 lg:pb-6">
        {fields === null ? (
          <p className="rounded-2xl bg-tint-lavender p-5 text-body-m" role="status">
            The database isn&apos;t connected yet. Add the Supabase environment variables to see fields of
            study.
          </p>
        ) : fields.length === 0 ? (
          <p className="rounded-2xl bg-blush p-5 text-body-m">
            No fields of study are published yet. Check back soon.
          </p>
        ) : shown && shown.length === 0 ? (
          <div className="rounded-2xl bg-blush p-5" role="status">
            <p className="text-label-l">No fields match “{query}”.</p>
            <p className="mt-1 text-body-s text-muted">
              Try a shorter word, like a subject you enjoy.{" "}
              <Link
                href="/explore"
                className="text-deep-rose underline underline-offset-2 hover:text-charcoal"
              >
                Show all fields
              </Link>
            </p>
          </div>
        ) : (
          <>
            {query && (
              <p className="mb-3 text-body-s text-muted" role="status">
                {shown!.length} {shown!.length === 1 ? "field matches" : "fields match"} “{query}”.{" "}
                <Link
                  href="/explore"
                  className="text-deep-rose underline underline-offset-2 hover:text-charcoal"
                >
                  Show all
                </Link>
              </p>
            )}
            <TwoColumns
              items={shown!.map((field) => ({ key: field.id, node: <FieldCard field={field} /> }))}
            />
          </>
        )}
      </Container>

      <Container className="pt-2 pb-7 lg:pb-16">
        <RememberCallout>
          These are just starting points. There are many more programmes and combinations, and universities
          may name them differently.
        </RememberCallout>
      </Container>
    </>
  );
}
