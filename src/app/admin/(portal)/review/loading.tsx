import { TableSkeleton } from "@/components/admin/Skeletons";

export default function Loading() {
  return <TableSkeleton title="Needs review" rows={8} />;
}
