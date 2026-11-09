import type { GuideError } from "@/lib/guideFiles";
import { GUIDE_MIME } from "@/lib/guideFiles";

/**
 * Sends a PDF straight to Storage with the signed URL the server made, and
 * reports progress (fetch can't, XMLHttpRequest can). The body is the same
 * form the Supabase client sends for a signed upload. Nothing here is
 * secret: the URL works for one path and expires.
 */
export function sendGuideFile(
  signedUrl: string,
  file: File,
  onProgress: (percent: number) => void,
): { done: Promise<{ ok: true } | { ok: false; error: GuideError }>; cancel: () => void } {
  const xhr = new XMLHttpRequest();
  const done = new Promise<{ ok: true } | { ok: false; error: GuideError }>((resolve) => {
    xhr.open("PUT", signedUrl);
    xhr.timeout = 15 * 60 * 1000;
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress(Math.min(100, Math.round((e.loaded / e.total) * 100)));
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) return resolve({ ok: true });
      resolve({
        ok: false,
        error: xhr.status === 413 ? "too-big" : xhr.status === 415 ? "bad-type" : "failed",
      });
    };
    xhr.onerror = () => resolve({ ok: false, error: "network" });
    xhr.ontimeout = () => resolve({ ok: false, error: "network" });
    xhr.onabort = () => resolve({ ok: false, error: "network" });

    const body = new FormData();
    body.append("cacheControl", "3600");
    // Some phones give a PDF no type; the bucket only takes application/pdf.
    body.append("", file.slice(0, file.size, GUIDE_MIME));
    xhr.send(body);
  });
  return { done, cancel: () => xhr.abort() };
}
