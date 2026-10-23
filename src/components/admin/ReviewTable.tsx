import Link from "next/link";
import { buttonStyles } from "@/components/ui/Button";
import { Chip, DeadlineChip } from "@/components/ui/Chip";
import { entryTypes, isEntryTable } from "@/lib/admin/content";
import { contentSections, type ReviewItem } from "@/lib/admin/dashboard";
import { formatLongDate } from "@/lib/format";

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;

function ReasonChip({ reason }: { reason: ReviewItem["reason"] }) {
  switch (reason.type) {
    case "deadline":
      return (
        <DeadlineChip urgent>
          {reason.days === 0 ? "Deadline today" : `Deadline in ${plural(reason.days, "day")}`}
        </DeadlineChip>
      );
    case "unverified":
      return <Chip tone="lavender">Not yet verified</Chip>;
    case "stale":
      return <Chip tone="coral">Not verified in 6+ months</Chip>;
    case "no-source":
      return <Chip tone="coral">Missing source link</Chip>;
  }
}

/** Universities and scholarships open in their editor; the rest go to their section for now. */
function reviewHref(item: ReviewItem) {
  if (isEntryTable(item.table)) return `${entryTypes[item.table].adminPath}/${item.id}`;
  return `/admin/${contentSections[item.table].section}`;
}

/** The Needs review table; on a phone each row stacks. */
export function ReviewTable({ items, failed }: { items: ReviewItem[]; failed: boolean }) {
  if (failed) {
    return (
      <p className="border-t border-border-soft px-5 py-4 text-body-s text-muted lg:px-6">
        Couldn’t load entries.
      </p>
    );
  }
  if (!items.length) {
    return (
      <p className="border-t border-border-soft px-5 py-4 text-body-s text-muted lg:px-6">
        Nothing needs review right now. Every entry is verified, recent and has a source.
      </p>
    );
  }
  return (
    <table className="w-full text-left">
      <thead className="hidden bg-cream md:table-header-group">
        <tr className="text-label-s text-muted">
          <th scope="col" className="px-6 py-2.5 font-semibold">
            Entry
          </th>
          <th scope="col" className="w-[120px] py-2.5 font-semibold">
            Last verified
          </th>
          <th scope="col" className="w-[206px] py-2.5 pl-4 font-semibold">
            Why it needs review
          </th>
          <th scope="col" className="w-[88px] py-2.5 pr-6">
            <span className="sr-only">Action</span>
          </th>
        </tr>
      </thead>
      <tbody>
        {items.map((item) => {
          const section = contentSections[item.table];
          return (
            <tr
              key={`${item.table}-${item.id}`}
              className="flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-border-soft px-5 py-3.5 md:table-row md:px-0"
            >
              <td className="w-full md:w-auto md:py-3.5 md:pl-6">
                <p className="text-label-m">{item.name}</p>
                <p className="text-caption text-muted">{section.kind}</p>
              </td>
              <td className="w-full text-body-s md:w-auto md:py-3.5">
                <span className="md:hidden">Last verified: </span>
                {item.lastVerifiedAt ? formatLongDate(item.lastVerifiedAt) : "Never"}
              </td>
              <td className="md:py-3.5 md:pl-4">
                <ReasonChip reason={item.reason} />
              </td>
              <td className="ml-auto md:py-3.5 md:pr-6 md:text-right">
                <Link href={reviewHref(item)} className={buttonStyles.text}>
                  Review<span className="sr-only"> {item.name}</span>
                </Link>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
