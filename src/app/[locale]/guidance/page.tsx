import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { ArticlesSection } from "@/components/guidance/ArticlesSection";
import { GuideSection } from "@/components/guidance/GuideSection";
import { ResourcesSection } from "@/components/guidance/ResourcesSection";
import { Container } from "@/components/layout/PageShell";
import { getGuideFiles, listGuidanceArticles, listResources } from "@/lib/data/public";
import { alternates } from "@/i18n/metadata";
import { withShare } from "@/i18n/share";
import { pageLocale, type LocaleParams } from "@/i18n/server";

export async function generateMetadata({ params }: { params: LocaleParams }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "guidance" });
  return withShare(
    { title: t("title"), description: t("metaDescription"), alternates: alternates("/guidance", locale) },
    locale,
  );
}

export const revalidate = 300;

/**
 * One page for the Higher Education Guide (#guide), the guidance articles
 * (#articles) and the resources (#resources). The article pages keep their
 * own addresses (/guidance/<slug>); the old /guide and /resources pages
 * redirect here (next.config.ts).
 */
export default async function GuidancePage({ params }: { params: LocaleParams }) {
  const locale = await pageLocale(params);
  const t = await getTranslations("guidance");
  const [articles, resources, guides] = await Promise.all([
    listGuidanceArticles(locale),
    listResources(locale),
    getGuideFiles(),
  ]);

  return (
    <Container className="pt-6 pb-10 lg:pt-12 lg:pb-16">
      <h1 className="text-h1 lg:text-[40px] lg:leading-[46px]">{t("title")}</h1>
      <p className="mt-3 text-body-m text-muted lg:mt-3.5 lg:max-w-[720px] lg:text-body-l">{t("intro")}</p>

      <div className="mt-8 flex flex-col gap-12 lg:mt-12 lg:gap-16">
        <GuideSection guides={guides} />
        <ArticlesSection articles={articles} />
        <ResourcesSection resources={resources} />
      </div>
    </Container>
  );
}
