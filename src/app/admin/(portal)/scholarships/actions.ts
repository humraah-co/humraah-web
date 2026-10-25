"use server";

import type { SaveState } from "@/lib/admin/content";
import { saveEntry } from "@/lib/admin/saveEntry";

/** The scholarship editor's save (see saveEntry for the checks). */
export async function saveScholarship(_prev: SaveState, form: FormData): Promise<SaveState> {
  return saveEntry("scholarships", form);
}
