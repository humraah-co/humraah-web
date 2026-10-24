import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Search } from "lucide-react";
import { StatusChip } from "@/components/admin/EntryChips";
import { PageHeader } from "@/components/admin/Workspace";
import { FormAlert } from "@/components/ui/Field";
import { NavForm } from "@/components/ui/NavForm";
import { entryTypes, type EntryTable } from "@/lib/admin/content";
import { listEntries, searchEntries, type EntryRow } from "@/lib/admin/entries";
import { getSessionClient, requireActiveMember } from "@/lib/admin/session";

export const metadata: Metadata = { title: "Search" };

/**
 * The dashboard's search: universities and scholarships in every status,
 * by name, short name, provider or web address. One match opens its
 * editor straight away.
 */
export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string | string[] }>;
}) {
  const supabase = await getSessionClient();
  const { q: raw } = await searchParams;
  const q = typeof raw === "string" ? raw.trim().slice(0, 100) : "";

  // Loaded alongside the membership check; nothing renders until it passes.
  const [, universities, scholarships] = await Promise.all([
    requireActiveMember(),
    q ? listEntries(supabase, "universities") : [],
    q ? listEntries(supabase, "scholarships") : [],
  ]);
  const groups: { table: EntryTable; rows: EntryRow[] | null }[] = [
    { table: "universities", rows: universities && searchEntries(universities, q) },
    { table: "scholarships", rows: scholarships && searchEntries(scholarships, q) },
  ];
  const matches = groups.flatMap((g) => (g.rows ?? []).map((row) => ({ table: g.table, row })));
  const failed = groups.some((g) => g.rows === null);
  if (q && !failed && matches.length === 1) {
    const { table, row } = matches[0];
    redirect(`${entryTypes[table].adminPath}/${row.id}`);
  }

  return (
    <>
      <PageHeader title="Search" description="Find a university or scholarship to edit, in any status." />
      <NavForm action="/admin/search" role="search" className="max-w-[560px]">
        <label className="flex h-[52px] items-center gap-2.5 rounded-pill border border-border-strong bg-card px-[18px] has-[input:focus-visible]:outline-3 has-[input:focus-visible]:outline-offset-2 has-[input:focus-visible]:outline-deep-rose">
          <Search className="size-5 shrink-0" strokeWidth={1.75} aria-hidden="true" />
          <span className="sr-only">Search universities and scholarships</span>
          <input
            type="search"
            name="q"
            defaultValue={q}
            placeholder="Search universities and scholarships"
            className="min-w-0 flex-1 bg-transparent text-body-m outline-none placeholder:text-muted"
          />
        </label>
      </NavForm>

      {failed && <FormAlert>We couldn’t search just now. Please refresh the page.</FormAlert>}
      {q && !failed && (
        <p role="status" className="text-body-s text-muted">
          {matches.length
            ? `${matches.length} results for “${q}”.`
            : `Nothing matches “${q}”. Check the spelling or try part of the name.`}
        </p>
      )}

      {groups.map(({ table, rows }) =>
        rows?.length ? (
          <section
            key={table}
            aria-labelledby={`${table}-results`}
            className="overflow-hidden rounded-[20px] border border-border-soft bg-card"
          >
            <h2 id={`${table}-results`} className="px-5 py-4 text-h3 lg:px-6">
              {entryTypes[table].label}
            </h2>
            <ul>
              {rows.map((row) => (
                <li key={row.id} className="border-t border-border-soft">
                  <Link
                    href={`${entryTypes[table].adminPath}/${row.id}`}
                    className="flex flex-wrap items-center gap-x-3 gap-y-1 px-5 py-3.5 hover:bg-cream lg:px-6"
                  >
                    <span className="flex min-w-0 flex-1 flex-col">
                      <span className="text-label-m text-deep-rose underline underline-offset-2">
                        {row.name}
                      </span>
                      {row.detail && <span className="text-caption text-muted">{row.detail}</span>}
                    </span>
                    <StatusChip status={row.status} />
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ) : null,
      )}
    </>
  );
}
