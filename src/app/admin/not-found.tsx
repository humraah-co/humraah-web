import { ButtonLink } from "@/components/ui/Button";
import { ADMIN_HOME } from "@/lib/admin/paths";

/** A workspace address that doesn't exist, e.g. an entry that was deleted. */
export default function AdminNotFound() {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-3 px-4 py-16 text-center lg:py-24">
      <h1 className="text-h1">We couldn&apos;t find that page</h1>
      <p className="text-body-m text-muted">It may have been deleted, or the link may be wrong.</p>
      <ButtonLink href={ADMIN_HOME} className="mt-3">
        Back to the dashboard
      </ButtonLink>
    </div>
  );
}
