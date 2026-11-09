"use server";

import {
  confirmGuideUpload as confirmUpload,
  removeGuide as removeFile,
  requestGuideUpload as requestUpload,
} from "@/lib/admin/guideActions";
import { createGuideDeps } from "@/lib/admin/guideDeps";
import type { GuideError } from "@/lib/guideFiles";

/*
 * The Guide PDFs tab. Each action re-reads the caller's membership on the
 * server and checks their role (see lib/admin/guideActions.ts); the database
 * checks again. The file itself never goes through here: the browser sends it
 * straight to Storage with the signed URL from requestGuideUpload, because
 * Vercel limits request bodies to about 4.5 MB.
 *
 * Plain objects, not redirects, so the screen can show what went wrong.
 */

type Failure = { ok: false; error: GuideError };

export async function requestGuideUpload(input: {
  language: string;
  fileName: string;
  size: number;
  type: string;
}): Promise<{ ok: true; path: string; signedUrl: string } | Failure> {
  return requestUpload(await createGuideDeps(), input);
}

export async function confirmGuideUpload(input: {
  language: string;
  path: string;
  fileName: string;
}): Promise<{ ok: true; fileName: string; size: number } | Failure> {
  return confirmUpload(await createGuideDeps(), input);
}

export async function removeGuide(input: { language: string }): Promise<{ ok: true } | Failure> {
  return removeFile(await createGuideDeps(), input);
}
