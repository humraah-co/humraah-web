import "server-only";
import { revalidatePath, revalidateTag } from "next/cache";
import { redirect } from "next/navigation";
import type { PostgrestError } from "@supabase/supabase-js";
import type { ContentStatus } from "@/lib/database.types";
import {
  entryTypes,
  isSaveIntent,
  isUuid,
  parseScholarship,
  parseUniversity,
  scholarshipRow,
  statusFor,
  universityRow,
  validateScholarship,
  validateUniversity,
  type EntryTable,
  type FieldErrors,
  type SaveIntent,
  type SaveState,
} from "./content";
import { slugTaken } from "./entries";
import { formText } from "./forms";
import { requireActiveMember } from "./session";

/*
 * Saving from the university and scholarship editors. The caller's
 * membership is re-read on the server and every value is checked again
 * here, whatever the browser already checked. The save itself is one
 * database call as the signed-in member (save_university /
 * save_scholarship), so row-level security, the restore rule and the
 * activity log all apply, and a failed save changes nothing.
 */

export const SAVE_FAILED = "We couldn’t save your changes just now. Nothing was changed; please try again.";
export const ENTRY_GONE = "This entry no longer exists. Someone may have deleted it.";
export const ENTRY_ARCHIVED =
  "This entry is archived, so it can’t be edited. An admin can restore it to drafts first.";

/** The public pages showing this kind of entry, plus the home page counts. */
export function revalidateEntries(table: EntryTable) {
  revalidateTag(table);
  revalidatePath("/");
}

export type SaveNotice =
  "created" | "saved" | "published" | "updated" | "unpublished" | "verified" | "verify-failed";

function noticeFor(intent: SaveIntent, isNew: boolean): SaveNotice {
  if (intent === "publish") return "published";
  if (intent === "update") return "updated";
  if (intent === "unpublish") return "unpublished";
  if (intent === "verify") return "verified";
  return isNew ? "created" : "saved";
}

/** Database refusals the person can act on, as field or form messages. */
function explain(error: PostgrestError, table: EntryTable, intent: SaveIntent): SaveState {
  const at = Date.now();
  const one = entryTypes[table].one;
  if (error.code === "23505") {
    return { status: "invalid", at, errors: { slug: slugTakenMessage(one) } };
  }
  if (error.code === "23514" && error.message.includes("source link")) {
    const message =
      intent === "verify"
        ? "Add the official source link before marking this as verified."
        : "Add the official source link before publishing.";
    return { status: "invalid", at, errors: { source_url: message } };
  }
  if (error.code === "P0002") return { status: "invalid", at, errors: {}, form: ENTRY_GONE };
  if (error.message.includes("Restore it first"))
    return { status: "invalid", at, errors: {}, form: ENTRY_ARCHIVED };
  if (error.code === "42501") {
    return { status: "invalid", at, errors: {}, form: "You don’t have permission to do that." };
  }
  console.error(`Saving a ${one} failed:`, error.code, error.message);
  return { status: "invalid", at, errors: {}, form: SAVE_FAILED };
}

const slugTakenMessage = (one: string) =>
  `Another ${one} already uses this web address. Please choose a different one, for example by adding the city.`;

export async function saveEntry(table: EntryTable, form: FormData): Promise<SaveState> {
  const { supabase } = await requireActiveMember();
  const fail = (message: string): SaveState => ({
    status: "invalid",
    errors: {},
    form: message,
    at: Date.now(),
  });

  const id = formText(form, "id") || null;
  const intent = formText(form, "intent");
  if ((id && !isUuid(id)) || !isSaveIntent(intent)) return fail(SAVE_FAILED);
  let raw: unknown;
  try {
    raw = JSON.parse(formText(form, "values"));
  } catch {
    return fail(SAVE_FAILED);
  }

  let current: ContentStatus | null = null;
  if (id) {
    const { data, error } = await supabase.from(table).select("status").eq("id", id).maybeSingle();
    if (error) return fail(SAVE_FAILED);
    if (!data) return fail(ENTRY_GONE);
    if (data.status === "archived") return fail(ENTRY_ARCHIVED);
    current = data.status;
  }
  const status = statusFor(intent, current);

  let errors: FieldErrors;
  let save: () => PromiseLike<{ data: string | null; error: PostgrestError | null }>;
  let slug: string;
  if (table === "universities") {
    const values = parseUniversity(raw);
    errors = validateUniversity(values, intent, status);
    const row = universityRow(values, status);
    slug = row.values.slug;
    save = () =>
      supabase.rpc("save_university", { p_id: id, p_values: row.values, p_programmes: row.programmes });
  } else {
    const values = parseScholarship(raw);
    errors = validateScholarship(values, intent, status);
    const row = scholarshipRow(values, status);
    slug = row.values.slug;
    save = () =>
      supabase.rpc("save_scholarship", { p_id: id, p_values: row.values, p_field_ids: row.fieldIds });
  }
  if (!errors.slug && (await slugTaken(supabase, table, slug, id))) {
    errors.slug = slugTakenMessage(entryTypes[table].one);
  }
  if (Object.keys(errors).length) return { status: "invalid", errors, at: Date.now() };

  const { data: savedId, error } = await save();
  if (error || !savedId) return error ? explain(error, table, intent) : fail(SAVE_FAILED);

  let notice: SaveNotice = noticeFor(intent, !id);
  if (intent === "verify") {
    const { error: verifyError } = await supabase
      .from(table)
      .update({ last_verified_at: new Date().toISOString() })
      .eq("id", savedId);
    if (verifyError) {
      console.error("Marking an entry as verified failed:", verifyError.code, verifyError.message);
      notice = "verify-failed";
    }
  }

  revalidateEntries(table);
  redirect(`${entryTypes[table].adminPath}/${savedId}?notice=${notice}`);
}

const noticeText: Record<SaveNotice, string> = {
  created: "Draft saved. It isn’t on the site until you publish it.",
  saved: "Draft saved.",
  published: "Published. It’s on the site now.",
  updated: "Changes saved. The site shows them now.",
  unpublished: "Moved to drafts. It’s no longer on the site.",
  verified: "Saved and marked as verified today.",
  "verify-failed": "Your changes were saved, but we couldn’t mark the entry as verified. Please try again.",
};

/** The message for a "?notice=" after saving, if it's one of ours. */
export function saveNotice(notice: unknown) {
  if (typeof notice !== "string" || !(notice in noticeText)) return undefined;
  const key = notice as SaveNotice;
  return {
    text: noticeText[key],
    tone: key === "verify-failed" ? ("problem" as const) : ("success" as const),
  };
}
