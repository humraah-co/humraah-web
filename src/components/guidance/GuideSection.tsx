import { Clock, Download } from "lucide-react";
import { useTranslations } from "next-intl";
import { buttonStyles } from "@/components/ui/Button";
import { guideChapters, guideLanguages } from "@/config/guide";
import type { PublicGuide, PublicGuides } from "@/lib/data/public";
import { formatFileSize, guideDownloadUrl, type GuideLanguage } from "@/lib/guideFiles";

/**
 * The Higher Education Guide part of the Guidance page: the two PDF
 * downloads and the list of what's inside. Everything is written in the
 * page's language only; the "English" and "Urdu" names come from the
 * message files, never from a fixed Urdu label.
 */
export function GuideSection({ guides }: { guides: PublicGuides }) {
  const t = useTranslations("guide");
  return (
    <section id="guide" aria-labelledby="guide-heading" className="scroll-mt-24 lg:scroll-mt-28">
      <h2 id="guide-heading" className="text-h2 lg:text-[40px] lg:leading-[46px]">
        {t("title")}
      </h2>
      <p className="mt-2 text-body-m text-muted lg:mt-3 lg:max-w-[720px] lg:text-body-l">{t("intro")}</p>

      <ul className="mt-5 grid gap-3 lg:mt-6 lg:grid-cols-2 lg:gap-6">
        {guideLanguages.map((language) => (
          <li key={language} className="flex">
            <DownloadCard language={language} file={guides[language]} />
          </li>
        ))}
      </ul>

      <h3 className="mt-7 text-h3 lg:mt-10">{t("inside")}</h3>
      <ol className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
        {guideChapters.map((chapter, i) => (
          <li
            key={chapter}
            className="flex gap-3.5 rounded-[20px] border border-border-soft bg-card p-4 lg:flex-col lg:gap-3 lg:p-5"
          >
            <span className="flex size-8 shrink-0 items-center justify-center rounded-pill bg-coral text-label-s text-ink">
              {i + 1}
            </span>
            <span className="flex min-w-0 flex-col gap-0.5 lg:gap-2">
              <span className="text-label-l">{t(`chapters.${chapter}.title`)}</span>
              <span className="text-body-s text-muted">{t(`chapters.${chapter}.summary`)}</span>
            </span>
          </li>
        ))}
      </ol>

      <p className="mt-5 font-script text-[30px] leading-[32px] text-deep-rose">{t("signOff")}</p>
    </section>
  );
}

/** Download/English and Download/Urdu. Without a file yet it says "Coming soon" instead of linking anywhere. */
function DownloadCard({ language: code, file }: { language: GuideLanguage; file: PublicGuide | null }) {
  const t = useTranslations("guide");
  const language = t(`languages.${code}`);
  const size = file ? formatFileSize(file.sizeBytes) : null;
  return (
    <div className="flex w-full flex-col gap-3 rounded-[20px] border border-border-soft bg-card p-4 lg:p-5">
      <div className="min-w-0">
        <p className="text-label-l">{language}</p>
        <p className="text-caption text-muted">{file ? t("pdfSize", { size: size! }) : t("pdfSoon")}</p>
        {file && (
          // The file's own name, as uploaded; it may be in either script.
          <p dir="auto" className="mt-0.5 text-caption break-words text-muted">
            {file.fileName}
          </p>
        )}
      </div>
      {file ? (
        <div className="mt-auto flex flex-wrap gap-2.5">
          <a
            href={guideDownloadUrl(file.url, file.fileName)}
            download={file.fileName}
            className={`${buttonStyles.primary} min-w-0 flex-1 px-4`}
            aria-label={t("downloadLabelSize", { language, size: size! })}
          >
            <Download className="size-5 shrink-0" strokeWidth={1.75} aria-hidden="true" />
            {t("download")}
          </a>
          <a
            href={file.url}
            target="_blank"
            rel="noopener noreferrer"
            className={`${buttonStyles.secondary} min-w-0 flex-1 px-4`}
          >
            {t("readOnline")}
            <span className="sr-only"> {t("readOnlineNote", { language })}</span>
          </a>
        </div>
      ) : (
        <p
          className="mt-auto flex items-center justify-center gap-2 rounded-pill bg-blush px-[22px] py-3.5 text-label-l text-muted"
          role="status"
        >
          <Clock className="size-5" strokeWidth={1.75} aria-hidden="true" />
          {t("comingSoon")}
        </p>
      )}
    </div>
  );
}
