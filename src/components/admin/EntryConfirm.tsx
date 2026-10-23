import { archiveEntry, deleteEntry, restoreEntry } from "@/app/admin/(portal)/entries/actions";
import { Modal } from "@/components/admin/Modal";
import { ButtonLink, buttonStyles } from "@/components/ui/Button";
import { Field, fieldClass } from "@/components/ui/Field";
import { entryTypes, type EntryTable } from "@/lib/admin/content";
import type { ContentStatus } from "@/lib/database.types";

type Entry = { id: string; name: string; status: ContentStatus };

/**
 * The confirm boxes for archiving, restoring and deleting, opened by the
 * address (e.g. ?confirm=archive) like the Team page's, so they work
 * without JavaScript. Restore and delete are only offered to admins and
 * only for archived entries; the actions check both again.
 */
export function EntryConfirm({
  table,
  entry,
  confirm,
  error,
  isAdmin,
}: {
  table: EntryTable;
  entry: Entry;
  confirm: unknown;
  error: unknown;
  isAdmin: boolean;
}) {
  const type = entryTypes[table];
  const closeHref = `${type.adminPath}/${entry.id}`;
  const archived = entry.status === "archived";

  const hidden = (
    <>
      <input type="hidden" name="table" value={table} />
      <input type="hidden" name="id" value={entry.id} />
    </>
  );
  const buttons = (label: string) => (
    <div className="flex flex-col-reverse gap-2.5 sm:flex-row sm:justify-end">
      <ButtonLink href={closeHref} variant="secondary">
        Cancel
      </ButtonLink>
      <button type="submit" className={`${buttonStyles.primary} cursor-pointer`}>
        {label}
      </button>
    </div>
  );

  if (confirm === "archive" && !archived) {
    return (
      <Modal title={`Archive ${entry.name}?`} closeHref={closeHref}>
        <p className="text-body-s text-muted">
          It comes off the site straight away and can’t be edited. Only an admin can restore it to drafts.
        </p>
        <form action={archiveEntry} className="flex flex-col gap-4">
          {hidden}
          {buttons("Archive")}
        </form>
      </Modal>
    );
  }

  if (confirm === "restore" && archived && isAdmin) {
    return (
      <Modal title={`Restore ${entry.name} to drafts?`} closeHref={closeHref}>
        <p className="text-body-s text-muted">
          It stays off the site until someone checks it and publishes it again.
        </p>
        <form action={restoreEntry} className="flex flex-col gap-4">
          {hidden}
          {buttons("Restore to drafts")}
        </form>
      </Modal>
    );
  }

  if (confirm === "delete" && archived && isAdmin) {
    const mismatch = error === "name";
    return (
      <Modal title={`Delete ${entry.name} permanently?`} closeHref={closeHref}>
        <p className="text-body-s text-muted">
          This can’t be undone.
          {table === "universities" ? " Its programmes are deleted too." : ""} The activity log keeps a record
          that it was deleted.
        </p>
        <form action={deleteEntry} noValidate className="flex flex-col gap-4">
          {hidden}
          <Field
            id="confirm_name"
            label={`Type the ${type.one}’s name to confirm`}
            hint={`Type: ${entry.name}`}
            error={mismatch ? `That doesn’t match. Type the name exactly as shown: ${entry.name}` : undefined}
          >
            <input
              id="confirm_name"
              name="confirm_name"
              type="text"
              autoComplete="off"
              spellCheck={false}
              required
              aria-invalid={mismatch}
              aria-describedby={mismatch ? "confirm_name-error" : "confirm_name-hint"}
              className={`${fieldClass} h-12`}
            />
          </Field>
          {buttons("Delete permanently")}
        </form>
      </Modal>
    );
  }

  return null;
}
