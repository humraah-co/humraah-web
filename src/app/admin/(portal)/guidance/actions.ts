"use server";

import type { SaveState } from "@/lib/admin/content";
import { saveEntry } from "@/lib/admin/saveEntry";

/** The guidance article editor's save (see saveEntry for the checks). */
export async function saveGuidance(_prev: SaveState, form: FormData): Promise<SaveState> {
  return saveEntry("guidance_articles", form);
}
