// The Higher Education Guide PDFs: the rules for what may be uploaded, shared
// by the admin screen (before it sends anything), the server actions (which
// check again) and the public Guidance page. Imports nothing, so unit tests
// can run it as it is. The same limits are in the database and the bucket
// (supabase/migrations/20261028000001_guide_files.sql).

export const GUIDE_BUCKET = "guides";
export const GUIDE_LANGUAGES = ["en", "ur"] as const;
export type GuideLanguage = (typeof GUIDE_LANGUAGES)[number];

/** 25 MB. */
export const MAX_GUIDE_BYTES = 25 * 1024 * 1024;
export const MAX_GUIDE_NAME = 200;
export const GUIDE_MIME = "application/pdf";

export const isGuideLanguage = (value: unknown): value is GuideLanguage =>
  typeof value === "string" && (GUIDE_LANGUAGES as readonly string[]).includes(value);

export type GuideError =
  | "signed-out"
  | "not-allowed"
  | "bad-language"
  | "bad-name"
  | "bad-type"
  | "empty"
  | "too-big"
  | "bad-path"
  | "missing"
  | "not-pdf"
  | "not-configured"
  | "network"
  | "failed";

/** What the admin screen tells the person for each problem. */
export const guideErrorMessages: Record<GuideError, string> = {
  "signed-out": "Your session has ended. Please sign in again.",
  "not-allowed": "You don’t have permission to do that.",
  "bad-language": "That isn’t one of the two guides.",
  "bad-name": "Please choose a file whose name ends in .pdf (200 characters or fewer).",
  "bad-type": "That file isn’t a PDF. Please choose a PDF.",
  empty: "That file is empty. Please choose another one.",
  "too-big": "That file is too big. A guide can be 25 MB at most.",
  "bad-path": "That upload wasn’t started here. Please try again.",
  missing: "The upload didn’t arrive. Please try again.",
  "not-pdf": "That file isn’t a real PDF, so it wasn’t used. Please choose another one.",
  "not-configured": "File uploads aren’t set up on this site yet.",
  network: "The upload was interrupted. Check your connection and try again.",
  failed: "Something went wrong. Please try again.",
};

export type GuideUploadRequest = {
  language: unknown;
  fileName: unknown;
  size: unknown;
  type: unknown;
};

export type ValidUpload = { language: GuideLanguage; fileName: string; size: number };

/**
 * A file name as it will be stored and shown: only the last part if a path
 * came with it, no control characters, no stray spaces. Null when nothing
 * usable is left, it is too long, or it doesn’t end in .pdf.
 */
export function cleanFileName(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const last = value.split(/[\\/]/).pop() ?? "";
  // eslint-disable-next-line no-control-regex
  const name = last.replace(/[\u0000-\u001f\u007f]/g, "").trim();
  if (!name || name.length > MAX_GUIDE_NAME || !/\.pdf$/i.test(name) || name.length <= 4) return null;
  return name;
}

/**
 * Checks a requested upload: the language, a .pdf file name, a size from
 * 1 byte to 25 MB and a PDF type. Some phones report no type at all for a
 * PDF, so an empty type is accepted; the real check is the file’s first
 * bytes (see isPdfHeader), made after it arrives.
 */
export function validateGuideUpload(
  input: GuideUploadRequest,
): { ok: true; value: ValidUpload } | { ok: false; error: GuideError } {
  if (!isGuideLanguage(input.language)) return { ok: false, error: "bad-language" };
  const fileName = cleanFileName(input.fileName);
  if (!fileName) return { ok: false, error: "bad-name" };
  if (typeof input.type !== "string" || (input.type !== "" && input.type.toLowerCase() !== GUIDE_MIME)) {
    return { ok: false, error: "bad-type" };
  }
  const size = input.size;
  if (typeof size !== "number" || !Number.isFinite(size) || !Number.isInteger(size)) {
    return { ok: false, error: "failed" };
  }
  if (size <= 0) return { ok: false, error: "empty" };
  if (size > MAX_GUIDE_BYTES) return { ok: false, error: "too-big" };
  return { ok: true, value: { language: input.language, fileName, size } };
}

const uuidPart = "[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}";

/** Where a new file for `language` goes in the bucket. */
export const guideStoragePath = (language: GuideLanguage, id: string) => `${language}/${id}.pdf`;

/** Whether `path` is a file name this feature made for `language`. */
export function isGuidePath(language: GuideLanguage, path: unknown): path is string {
  return typeof path === "string" && new RegExp(`^${language}/${uuidPart}\\.pdf$`).test(path);
}

/** A PDF starts with "%PDF-". */
export function isPdfHeader(bytes: Uint8Array) {
  const magic = [0x25, 0x50, 0x44, 0x46, 0x2d];
  return bytes.length >= magic.length && magic.every((b, i) => bytes[i] === b);
}

/** "850 KB", "3.2 MB". Latin letters and digits in both languages, as for other abbreviations. */
export function formatFileSize(bytes: number) {
  const kb = Math.max(1, Math.round(bytes / 1024));
  if (kb < 1024) return `${kb} KB`;
  const mb = bytes / (1024 * 1024);
  return `${mb < 10 ? mb.toFixed(1) : Math.round(mb)} MB`;
}

/** The public address of a file in the "guides" bucket. */
export function guidePublicUrl(supabaseUrl: string, path: string) {
  return `${supabaseUrl.replace(/\/+$/, "")}/storage/v1/object/public/${GUIDE_BUCKET}/${path}`;
}

/**
 * The same address asking Storage to send the file as a download under its
 * own name (the `download` attribute alone is ignored for another site).
 */
export const guideDownloadUrl = (url: string, fileName: string) =>
  `${url}?download=${encodeURIComponent(fileName)}`;
