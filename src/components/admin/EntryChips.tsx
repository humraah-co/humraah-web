import { Chip, type ChipTone } from "@/components/ui/Chip";
import { contentStatusLabels } from "@/lib/admin/content";
import type { ContentStatus } from "@/lib/database.types";
import { formatLongDate, isStale } from "@/lib/format";

const statusTones: Record<ContentStatus, ChipTone> = {
  published: "sage",
  draft: "lavender",
  archived: "outline",
};

export function StatusChip({ status }: { status: ContentStatus }) {
  return <Chip tone={statusTones[status]}>{contentStatusLabels[status]}</Chip>;
}

/** The date an entry was last checked, or why it needs checking (same wording as the dashboard). */
export function VerifiedCell({ verifiedAt }: { verifiedAt: string | null }) {
  if (!verifiedAt) return <Chip tone="lavender">Not yet verified</Chip>;
  if (isStale(verifiedAt)) {
    return (
      <span className="flex flex-col items-start gap-1">
        <Chip tone="coral">Not verified in 6+ months</Chip>
        <span className="text-caption text-muted">{formatLongDate(verifiedAt)}</span>
      </span>
    );
  }
  return <>{formatLongDate(verifiedAt)}</>;
}
