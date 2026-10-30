import type { Metadata } from "next";
import { Clock, Download } from "lucide-react";
import { useTranslations } from "next-intl";
import { getTranslations } from "next-intl/server";
import { LogoStacked } from "@/components/brand/Logo";
import { Container } from "@/components/layout/PageShell";
import { buttonStyles } from "@/components/ui/Button";
import { guideChapters, guidePdfs, type GuidePdf } from "@/config/guide";
import { alternates } from "@/i18n/metadata";
import { pageLocale, type LocaleParams } from "@/i18n/server";

export async function generateMetadata({ params }: { params: LocaleParams }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "guide" });
  return { title: t("title"), description: t("metaDescription"), alternates: alternates("/guide", locale) };
}

export default async function GuidePage({ params }: { params: LocaleParams }) {
  await pageLocale(params);
  const t = await getTranslations("guide");
  return (
    <Container className="pt-6 pb-7 lg:pt-12 lg:pb-16">
      <div className="flex flex-col gap-3 lg:grid lg:grid-cols-[457px_minmax(0,1fr)] lg:items-center lg:gap-x-16">
        <div className="flex flex-col gap-3 lg:col-start-2 lg:row-start-1 lg:gap-5">
          <h1 className="text-h1 lg:text-[56px] lg:leading-[60px] lg:tracking-[-0.8px]">{t("title")}</h1>
          <p className="text-body-m text-muted lg:text-body-l">{t("intro")}</p>
          <ul className="mt-4 hidden gap-4 lg:grid lg:grid-cols-2">
            {guidePdfs.map((pdf) => (
              <li key={pdf.language}>
                <DownloadCard pdf={pdf} />
              </li>
            ))}
          </ul>
        </div>

        <div className="flex justify-center rounded-[28px] bg-blush p-6 lg:col-start-1 lg:row-start-1 lg:rounded-[40px] lg:p-[67px]">
          <div className="flex h-[252px] w-[190px] flex-col items-center justify-center gap-3 rounded-[14px] border border-border-soft bg-cream p-4 lg:h-[340px] lg:w-[256px] lg:gap-4">
            <LogoStacked size="cover" />
            <p className="text-center text-label-s lg:text-label-l">{t("title")}</p>
          </div>
        </div>
      </div>

      <ul className="mt-6 flex flex-col gap-3 lg:hidden">
        {guidePdfs.map((pdf) => (
          <li key={pdf.language}>
            <DownloadCard pdf={pdf} />
          </li>
        ))}
      </ul>

      <section aria-labelledby="inside-heading" className="mt-8 lg:mt-14">
        <h2 id="inside-heading" className="text-h2 lg:text-[40px] lg:leading-[46px]">
          {t("inside")}
        </h2>
        <ol className="mt-1 flex flex-col lg:mt-5 lg:grid lg:grid-cols-3 lg:gap-6">
          {guideChapters.map((chapter, i) => (
            <li
              key={chapter}
              className="flex gap-3.5 border-t border-border-soft py-3 first:border-0 lg:flex-col lg:gap-3 lg:rounded-[20px] lg:border lg:border-border-soft lg:bg-card lg:p-5 lg:first:border"
            >
              <span className="flex size-8 shrink-0 items-center justify-center rounded-pill bg-coral text-label-s">
                {i + 1}
              </span>
              <span className="flex min-w-0 flex-col gap-0.5 lg:gap-2">
                <span className="text-label-l">{t(`chapters.${chapter}.title`)}</span>
                <span className="text-body-s text-muted">{t(`chapters.${chapter}.summary`)}</span>
              </span>
            </li>
          ))}
        </ol>
      </section>

      <p className="mt-4 font-script text-[30px] leading-[32px] text-deep-rose lg:mt-6">{t("signOff")}</p>
    </Container>
  );
}

/** Download/English and Download/Urdu. Without a file yet it says "Coming soon" instead of linking anywhere. */
function DownloadCard({ pdf }: { pdf: GuidePdf }) {
  const t = useTranslations("guide");
  const ready = !!pdf.url;
  const language = t(`languages.${pdf.language}`);
  return (
    <div className="flex h-full flex-col gap-3 rounded-[20px] border border-border-soft bg-card p-4 lg:p-5">
      <div className="flex items-center gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-label-l">{language}</p>
          <p className="text-caption text-muted">
            {ready ? (pdf.size ? t("pdfSize", { size: pdf.size }) : t("pdf")) : t("pdfSoon")}
          </p>
        </div>
        {pdf.nativeName && (
          <p lang="ur" dir="rtl" className="font-urdu text-[16px] leading-[36px]">
            {pdf.nativeName}
          </p>
        )}
      </div>
      {ready ? (
        <div className="flex gap-2.5">
          <a
            href={pdf.url!}
            download
            className={`${buttonStyles.primary} min-w-0 flex-1 px-4`}
            aria-label={
              pdf.size
                ? t("downloadLabelSize", { language, size: pdf.size })
                : t("downloadLabel", { language })
            }
          >
            <Download className="size-5 shrink-0" strokeWidth={1.75} aria-hidden="true" />
            {t("download")}
          </a>
          <a
            href={pdf.url!}
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
          className="flex items-center justify-center gap-2 rounded-pill bg-blush px-[22px] py-3.5 text-label-l text-muted"
          role="status"
        >
          <Clock className="size-5" strokeWidth={1.75} aria-hidden="true" />
          {t("comingSoon")}
        </p>
      )}
    </div>
  );
}
