"use server";

import type { SaveState } from "@/lib/admin/content";
import { saveEntry } from "@/lib/admin/saveEntry";

/** The field of study editor's save (see saveEntry for the checks). */
export async function saveField(_prev: SaveState, form: FormData): Promise<SaveState> {
  return saveEntry("fields", form);
}
