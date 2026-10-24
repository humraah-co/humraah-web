import Link from "next/link";
import { Plus, Search } from "lucide-react";
import { StatusChip, VerifiedCell } from "@/components/admin/EntryChips";
import { PageHeader, Pager } from "@/components/admin/Workspace";
import { ButtonLink, buttonStyles } from "@/components/ui/Button";
import { NavForm } from "@/components/ui/NavForm";
import { OptionChip } from "@/components/ui/Chip";
import { FormAlert, FormNotice } from "@/components/ui/Field";
import { entryTypes, type EntryTable } from "@/lib/admin/content";
import { searchEntries, type EntryRow } from "@/lib/admin/entries";
import type { ContentStatus } from "@/lib/database.types";
import { timeAgo } from "@/lib/format";

export const PAGE_SIZE = 50;

type Tab = "all" | ContentStatus;
const tabs: { key: Tab; label: string }[] = [
  { key: "all", label: "All" },
  { key: "published", label: "Published" },
  { key: "draft", label: "Drafts" },
  { key: "archived", label: "Archived" },
];

export type ListParams = { status: Tab; q: string; page: number };

const one = (value: string | string[] | undefined) => (typeof value === "string" ? value : "");

export function readListParams(raw: Record<string, string | string[] | undefined>): ListParams {
  const status = one(raw.status);
  const page = Number.parseInt(one(raw.page), 10);
  return {
    status: tabs.some((t) => t.key === status) ? (status as Tab) : "all",
    q: one(raw.q).trim().slice(0, 100),
    page: Number.isFinite(page) && page > 1 ? page : 1,
  };
}

function listHref(base: string, params: Partial<ListParams>) {
  const query = new URLSearchParams();
  if (params.status && params.status !== "all") query.set("status", params.status);
  if (params.q) query.set("q", params.q);
  if (params.page && params.page > 1) query.set("page", String(params.page));
  const s = query.toString();
  return s ? `${base}?${s}` : base;
}

const copy = {
  universities: {
    description: "Add and update university profiles. Every entry needs an official source.",
    add: "Add university",
  },
  scholarships: {
    description:
      "Keep eligibility, coverage and deadlines current. Mark each one verified after checking the provider’s site.",
    add: "Add scholarship",
  },
};

/**
 * Admin – Universities (Figma 35:3144) and Admin – Scholarships (35:3417):
 * status tabs with counts, a search box and the table. Tabs, search and
 * page live in the address, so Back and shared links keep them.
 */
export function EntryList({
  table,
  rows,
  names,
  params,
  notice,
}: {
  table: EntryTable;
  rows: EntryRow[] | null;
  names: Map<string, string>;
  params: ListParams;
  notice?: string;
}) {
  const type = entryTypes[table];
  const base = type.adminPath;

  const matching = searchEntries(rows ?? [], params.q);
  const counts: Record<Tab, number> = {
    all: matching.length,
    published: matching.filter((r) => r.status === "published").length,
    draft: matching.filter((r) => r.status === "draft").length,
    archived: matching.filter((r) => r.status === "archived").length,
  };
  const shown = params.status === "all" ? matching : matching.filter((r) => r.status === params.status);
  const pages = Math.max(1, Math.ceil(shown.length / PAGE_SIZE));
  const page = Math.min(params.page, pages);
  const pageRows = shown.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <>
      <PageHeader title={type.label} description={copy[table].description}>
        <NavForm action={base} role="search" className="lg:w-[320px]">
          {params.status !== "all" && <input type="hidden" name="status" value={params.status} />}
          <label className="flex h-[52px] items-center gap-2.5 rounded-pill border border-border-strong bg-card px-[18px] has-[input:focus-visible]:outline-3 has-[input:focus-visible]:outline-offset-2 has-[input:focus-visible]:outline-deep-rose">
            <Search className="size-5 shrink-0" strokeWidth={1.75} aria-hidden="true" />
            <span className="sr-only">Search {type.label.toLowerCase()} by name</span>
            <input
              type="search"
              name="q"
              defaultValue={params.q}
              placeholder="Search"
              className="min-w-0 flex-1 bg-transparent text-body-m outline-none placeholder:text-muted"
            />
          </label>
        </NavForm>
        <ButtonLink href={`${base}/new`}>
          <Plus className="size-5" strokeWidth={1.75} aria-hidden="true" />
          {copy[table].add}
        </ButtonLink>
      </PageHeader>

      {notice && <FormNotice>{notice}</FormNotice>}

      <nav aria-label={`Filter ${type.label.toLowerCase()} by status`} className="flex flex-wrap gap-2">
        {tabs.map((tab) => (
          <OptionChip
            key={tab.key}
            href={listHref(base, { status: tab.key, q: params.q })}
            selected={params.status === tab.key}
          >
            {tab.label}
            <span className="text-muted">{counts[tab.key]}</span>
          </OptionChip>
        ))}
      </nav>

      {rows === null ? (
        <FormAlert>We couldn’t load the {type.label.toLowerCase()}. Please refresh the page.</FormAlert>
      ) : (
        <div className="overflow-hidden rounded-[20px] border border-border-soft bg-card">
          {pageRows.length ? (
            <table className="w-full text-left">
              <caption className="sr-only">
                {type.label}
                {params.q && `, matching “${params.q}”`}
              </caption>
              <thead className="hidden bg-cream md:table-header-group">
                <tr className="text-label-s text-muted">
                  <th scope="col" className="px-6 py-3 font-semibold">
                    Name
                  </th>
                  <th scope="col" className="w-[130px] py-3 font-semibold">
                    Status
                  </th>
                  <th scope="col" className="w-[190px] py-3 font-semibold">
                    Last verified
                  </th>
                  <th scope="col" className="w-[190px] py-3 font-semibold">
                    Last updated
                  </th>
                  <th scope="col" className="w-[80px] py-3 pr-6">
                    <span className="sr-only">Action</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {pageRows.map((row) => (
                  <EntryListRow key={row.id} row={row} base={base} names={names} />
                ))}
              </tbody>
            </table>
          ) : (
            <p className="px-5 py-6 text-body-s text-muted lg:px-6">
              {params.q
                ? `Nothing matches “${params.q}”. Check the spelling or try part of the name.`
                : params.status === "all"
                  ? `No ${type.label.toLowerCase()} yet. Use “${copy[table].add}” to start one.`
                  : `No ${tabs.find((t) => t.key === params.status)!.label.toLowerCase()} right now.`}
            </p>
          )}
          {shown.length > 0 && (
            <Pager
              page={page}
              pageSize={PAGE_SIZE}
              total={shown.length}
              noun={type.label.toLowerCase()}
              hrefFor={(p) => listHref(base, { ...params, page: p })}
            />
          )}
        </div>
      )}
    </>
  );
}

/** One row; on a phone the columns stack, like the Team page. */
function EntryListRow({ row, base, names }: { row: EntryRow; base: string; names: Map<string, string> }) {
  const by = row.updated_by ? names.get(row.updated_by) : undefined;
  return (
    <tr className="flex flex-wrap items-center gap-x-3 gap-y-2 border-t border-border-soft px-5 py-3.5 first:border-t-0 md:table-row md:border-t md:px-0 md:first:border-t">
      <td className="w-full md:w-auto md:py-3.5 md:pl-6">
        <p className="text-label-m">{row.name}</p>
        {row.detail && <p className="text-caption text-muted">{row.detail}</p>}
      </td>
      <td className="md:py-3.5">
        <span className="sr-only md:hidden">Status: </span>
        <StatusChip status={row.status} />
      </td>
      <td className="text-body-s md:py-3.5">
        <span className="sr-only md:hidden">Last verified: </span>
        <VerifiedCell verifiedAt={row.last_verified_at} />
      </td>
      <td className="w-full text-body-s md:w-auto md:py-3.5">
        <span className="text-muted md:hidden">Last updated: </span>
        {timeAgo(row.updated_at)}
        {by && <span className="block text-caption text-muted md:mt-0.5">by {by}</span>}
      </td>
      <td className="md:py-3.5 md:pr-6 md:text-right">
        <Link href={`${base}/${row.id}`} className={buttonStyles.text}>
          Edit<span className="sr-only"> {row.name}</span>
        </Link>
      </td>
    </tr>
  );
}
