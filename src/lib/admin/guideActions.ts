// What happens when the team uploads, replaces or removes a Higher Education
// Guide PDF. The three server actions (app/admin/(portal)/guidance/guides)
// call these with the real session, database and Storage; the unit tests call
// them with stand-ins. Imports only the shared rules, so Node can run it.
//
// Who may do what, checked here on every call from the caller's membership as
// the server read it just now, never from anything the browser sent:
//   upload or replace   any active member (researcher, admin, owner)
//   remove              active admins and the owner
// The database checks the same rules again (row-level security).
//
// The file itself never passes through the server: the browser uploads it
// straight to Storage with a signed URL from requestGuideUpload, then
// confirmGuideUpload checks what arrived before it becomes the live guide.
import {
  MAX_GUIDE_BYTES,
  cleanFileName,
  guideStoragePath,
  isGuideLanguage,
  isGuidePath,
  isPdfHeader,
  validateGuideUpload,
  type GuideError,
  type GuideLanguage,
  type GuideUploadRequest,
} from "../guideFiles.ts";

export type GuideMember = {
  user_id: string;
  role: "researcher" | "admin" | "owner";
  status: "invited" | "active" | "suspended";
};

const isActive = (member: GuideMember | null | undefined): member is GuideMember =>
  !!member && member.status === "active";

/** Any active member. Invited and suspended members can do nothing. */
export const canUploadGuide = (member: GuideMember | null | undefined) =>
  isActive(member) && ["researcher", "admin", "owner"].includes(member.role);

/** Active admins and the owner only. */
export const canRemoveGuide = (member: GuideMember | null | undefined) =>
  isActive(member) && (member.role === "admin" || member.role === "owner");

export type GuideRow = {
  language: GuideLanguage;
  storage_path: string;
  file_name: string;
  size_bytes: number;
};

/** Everything the actions need from outside; the real ones are in guideDeps.ts. */
export type GuideDeps = {
  /** Who is calling, read fresh from the session and the team table. */
  getCaller(): Promise<{ signedIn: boolean; member: GuideMember | null }>;
  newId(): string;
  /** Null when the service-role key isn't set. */
  storage: {
    createSignedUpload(path: string): Promise<{ signedUrl: string } | null>;
    /** The object's size and first bytes, or null if there is no such object. */
    inspect(path: string): Promise<{ size: number; header: Uint8Array } | null>;
    remove(path: string): Promise<boolean>;
  } | null;
  db: {
    get(language: GuideLanguage): Promise<GuideRow | null>;
    save(row: GuideRow): Promise<boolean>;
    /** How many rows were deleted (0 when the database refused or there was none). */
    delete(language: GuideLanguage): Promise<number>;
  };
  /** Clears the cached Guidance page. */
  revalidate(): void;
};

type Failure = { ok: false; error: GuideError };
const fail = (error: GuideError): Failure => ({ ok: false, error });

type Allowed = { ok: true; member: GuideMember };

async function authorise(
  deps: GuideDeps,
  allowed: (member: GuideMember | null) => boolean,
): Promise<Allowed | Failure> {
  const { signedIn, member } = await deps.getCaller();
  if (!signedIn) return fail("signed-out");
  if (!allowed(member)) return fail("not-allowed");
  return { ok: true, member: member! };
}

/** Step 1: a signed URL for the browser to upload to, if the request is allowed and valid. */
export async function requestGuideUpload(
  deps: GuideDeps,
  input: GuideUploadRequest,
): Promise<{ ok: true; path: string; signedUrl: string } | Failure> {
  try {
    const who = await authorise(deps, canUploadGuide);
    if (!who.ok) return who;
    const valid = validateGuideUpload(input);
    if (!valid.ok) return fail(valid.error);
    if (!deps.storage) return fail("not-configured");
    const path = guideStoragePath(valid.value.language, deps.newId());
    const upload = await deps.storage.createSignedUpload(path);
    if (!upload) return fail("failed");
    return { ok: true, path, signedUrl: upload.signedUrl };
  } catch (error) {
    console.error("Starting a guide upload failed:", error instanceof Error ? error.message : "unknown");
    return fail("failed");
  }
}

/**
 * Step 2, after the browser has uploaded: the file must exist, be 25 MB at
 * most and start with %PDF-. If so it becomes the live guide and the one it
 * replaces is deleted; if not, the upload is deleted.
 */
export async function confirmGuideUpload(
  deps: GuideDeps,
  input: { language: unknown; path: unknown; fileName: unknown },
): Promise<{ ok: true; fileName: string; size: number } | Failure> {
  try {
    const who = await authorise(deps, canUploadGuide);
    if (!who.ok) return who;
    const { language, path } = input;
    if (!isGuideLanguage(language)) return fail("bad-language");
    if (!isGuidePath(language, path)) return fail("bad-path");
    const fileName = cleanFileName(input.fileName);
    if (!fileName) return fail("bad-name");
    const { storage } = deps;
    if (!storage) return fail("not-configured");

    const found = await storage.inspect(path);
    if (!found) return fail("missing");
    const problem: GuideError | null =
      found.size <= 0
        ? "empty"
        : found.size > MAX_GUIDE_BYTES
          ? "too-big"
          : !isPdfHeader(found.header)
            ? "not-pdf"
            : null;
    if (problem) {
      await storage.remove(path);
      return fail(problem);
    }

    const before = await deps.db.get(language);
    const saved = await deps.db.save({
      language,
      storage_path: path,
      file_name: fileName,
      size_bytes: found.size,
    });
    if (!saved) {
      await storage.remove(path);
      return fail("failed");
    }
    // The old file is no longer linked from anywhere. If this fails it is
    // only an unused file left in the bucket.
    if (before && before.storage_path !== path) await storage.remove(before.storage_path);
    deps.revalidate();
    return { ok: true, fileName, size: found.size };
  } catch (error) {
    console.error("Confirming a guide upload failed:", error instanceof Error ? error.message : "unknown");
    return fail("failed");
  }
}

/** Removes a guide: admins and the owner only. */
export async function removeGuide(
  deps: GuideDeps,
  input: { language: unknown },
): Promise<{ ok: true } | Failure> {
  try {
    const who = await authorise(deps, canRemoveGuide);
    if (!who.ok) return who;
    const { language } = input;
    if (!isGuideLanguage(language)) return fail("bad-language");
    const { storage } = deps;
    if (!storage) return fail("not-configured");

    const before = await deps.db.get(language);
    if (before) {
      if ((await deps.db.delete(language)) === 0) return fail("not-allowed");
      await storage.remove(before.storage_path);
    }
    deps.revalidate();
    return { ok: true };
  } catch (error) {
    console.error("Removing a guide failed:", error instanceof Error ? error.message : "unknown");
    return fail("failed");
  }
}
