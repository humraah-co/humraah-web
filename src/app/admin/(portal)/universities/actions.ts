"use server";

import type { SaveState } from "@/lib/admin/content";
import { saveEntry } from "@/lib/admin/saveEntry";

/** The university editor's save (see saveEntry for the checks). */
export async function saveUniversity(_prev: SaveState, form: FormData): Promise<SaveState> {
  return saveEntry("universities", form);
}
