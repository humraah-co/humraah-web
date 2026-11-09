import { GuidePdfCard, type CurrentGuide } from "@/components/admin/GuidePdfCard";
import { formatLongDate } from "@/lib/format";
import { GUIDE_LANGUAGES, guidePublicUrl, type GuideLanguage } from "@/lib/guideFiles";
import type { GuideFile } from "@/lib/database.types";

const when = (iso: string) =>
  `${formatLongDate(iso)}, ${new Date(iso).toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Karachi",
  })}`;

/**
 * The "Guide PDFs" tab: the English and the Urdu Higher Education Guide.
 * Every team member can upload and replace; only admins and the owner see
 * Remove (and the server refuses anyone else who tries).
 */
export function GuidePdfs({
  files,
  names,
  supabaseUrl,
  canRemove,
}: {
  files: GuideFile[];
  names: Map<string, string>;
  supabaseUrl: string | null;
  canRemove: boolean;
}) {
  const current = (language: GuideLanguage): CurrentGuide | null => {
    const file = files.find((f) => f.language === language);
    if (!file || !supabaseUrl) return null;
    return {
      fileName: file.file_name,
      sizeBytes: file.size_bytes,
      updated: when(file.updated_at),
      uploader: file.uploaded_by ? (names.get(file.uploaded_by) ?? null) : null,
      url: guidePublicUrl(supabaseUrl, file.storage_path),
    };
  };
  return (
    <div className="grid gap-4 lg:grid-cols-2 lg:gap-6">
      {GUIDE_LANGUAGES.map((language) => (
        <GuidePdfCard key={language} language={language} current={current(language)} canRemove={canRemove} />
      ))}
    </div>
  );
}
