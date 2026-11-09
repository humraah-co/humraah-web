import "server-only";
import { randomUUID } from "node:crypto";
import { revalidatePath, revalidateTag } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSupabaseEnv } from "@/lib/supabase/env";
import { GUIDE_BUCKET, GUIDE_CACHE_TAG, guidePublicUrl, type GuideLanguage } from "@/lib/guideFiles";
import { getAdminSession } from "./session";
import type { GuideDeps, GuideMember, GuideRow } from "./guideActions";

/** How many bytes of the start of a file are enough to see whether it is a PDF. */
const HEADER_BYTES = 5;

/**
 * The real session, database and Storage for the guide actions. Table
 * changes use the caller's own session (so row-level security and the
 * activity log apply, and uploaded_by is them); the service-role client
 * only signs upload URLs and deletes files in the "guides" bucket, and
 * never leaves the server.
 */
export async function createGuideDeps(): Promise<GuideDeps> {
  const session = await getAdminSession();
  const supabase = session?.supabase;
  const service = createAdminClient();
  const env = getSupabaseEnv();

  return {
    async getCaller() {
      if (!session?.user) return { signedIn: false, member: null };
      const { member } = session;
      return {
        signedIn: true,
        member: member
          ? ({ user_id: member.user_id, role: member.role, status: member.status } as GuideMember)
          : null,
      };
    },
    newId: () => randomUUID(),
    storage:
      service && env
        ? {
            async createSignedUpload(path) {
              const { data, error } = await service.storage.from(GUIDE_BUCKET).createSignedUploadUrl(path);
              if (error || !data) {
                console.error("Signing a guide upload failed:", error?.message);
                return null;
              }
              return { signedUrl: data.signedUrl };
            },
            async inspect(path) {
              // The bucket is public: ask for just the first bytes. The
              // answer says how big the whole file is.
              const res = await fetch(guidePublicUrl(env.url, path), {
                headers: { Range: `bytes=0-${HEADER_BYTES - 1}` },
                cache: "no-store",
              });
              if (!res.ok) return null;
              const total = /\/(\d+)$/.exec(res.headers.get("content-range") ?? "")?.[1];
              const size = Number(total ?? res.headers.get("content-length"));
              if (!Number.isFinite(size)) return null;
              // A server that ignores Range sends the whole file; only read the start.
              const reader = res.body?.getReader();
              if (!reader) return null;
              const chunks: number[] = [];
              while (chunks.length < HEADER_BYTES) {
                const { done, value } = await reader.read();
                if (done) break;
                chunks.push(...value);
              }
              await reader.cancel().catch(() => {});
              return { size, header: Uint8Array.from(chunks.slice(0, HEADER_BYTES)) };
            },
            async remove(path) {
              const { error } = await service.storage.from(GUIDE_BUCKET).remove([path]);
              if (error) console.error("Removing a guide file failed:", error.message);
              return !error;
            },
          }
        : null,
    db: {
      async get(language: GuideLanguage) {
        const { data } = await supabase!
          .from("guide_files")
          .select("language, storage_path, file_name, size_bytes")
          .eq("language", language)
          .maybeSingle();
        return (data as GuideRow | null) ?? null;
      },
      async save(row) {
        const { error } = await supabase!.from("guide_files").upsert(row, { onConflict: "language" });
        if (error) console.error("Saving a guide file failed:", error.code);
        return !error;
      },
      async delete(language) {
        const { data, error } = await supabase!
          .from("guide_files")
          .delete()
          .eq("language", language)
          .select("language");
        if (error) console.error("Deleting a guide file failed:", error.code);
        return data?.length ?? 0;
      },
    },
    revalidate() {
      revalidateTag(GUIDE_CACHE_TAG);
      // Every language's Guidance page.
      revalidatePath("/[locale]/guidance", "page");
    },
  };
}
