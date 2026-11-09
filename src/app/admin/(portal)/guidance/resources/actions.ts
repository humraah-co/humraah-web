"use server";

import type { SaveState } from "@/lib/admin/content";
import { saveEntry } from "@/lib/admin/saveEntry";

/** The resource editor's save (see saveEntry for the checks). */
export async function saveResource(_prev: SaveState, form: FormData): Promise<SaveState> {
  return saveEntry("resources", form);
}
