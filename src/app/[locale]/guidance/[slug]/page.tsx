import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ChevronRight, Clock, Globe } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { ResourceCard } from "@/components/content/Cards";
import { Markdown } from "@/components/content/Markdown";
import { Container } from "@/components/layout/PageShell";
import { HelpCallout, ImportantCallout, NextSteps, StaleNotice } from "@/components/ui/Blocks";
import { EnglishNote, englishAttrs } from "@/components/ui/InEnglish";
import { getGuidanceArticle, listGuidanceArticles } from "@/lib/data/public";
import { hostOf, readMinutes } from "@/lib/format";
import { Link } from "@/i18n/navigation";
import { toLocale } from "@/i18n/config";
import { alternates } from "@/i18n/metadata";
import { withShare } from "@/i18n/share";
import { pageLocale, type LocaleParams } from "@/i18n/server";

type Props = { params: LocaleParams<{ slug: string }> };

export const revalidate = 300;

export async function generateStaticParams() {
  return ((await listGuidanceArticles()) ?? []).map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, locale } = await params;
  const article = await getGuidanceArticle(slug, toLocale(locale));
  const t = await getTranslations({ locale, namespace: "guidance" });
  if (!article) return { title: t("title") };
  return withShare(
    {
      title: article.title,
      description: article.summary ?? undefined,
      alternates: alternates(`/guidance/${slug}`, locale),
    },
    locale,
  );
}

export default async function GuidanceArticlePage({ params }: Props) {
  const locale = await pageLocale(params);
  const t = await getTranslations("guidance");
  const common = await getTranslations("common");
  const { slug } = await params;
  const article = await getGuidanceArticle(slug, locale);
  if (article === null) {
    return (
      <Container className="py-12">
        <p className="rounded-2xl bg-tint-lavender p-5 text-body-m" role="status">
          {t("articleNotConnected")}
        </p>
      </Container>
    );
  }
  if (!article) notFound();
  const a = article;

  return (
    <Container className="pt-5 pb-7 lg:pt-4 lg:pb-16">
      <nav aria-label={common("breadcrumb")} className="hidden items-center gap-1.5 text-body-s lg:flex">
        <Link
          href="/guidance"
          className="py-2.5 text-label-m text-deep-rose underline underline-offset-2 hover:text-charcoal"
        >
          {t("title")}
        </Link>
        <ChevronRight className="size-4" strokeWidth={1.75} aria-hidden="true" />
        <span aria-current="page" className="text-muted">
          {a.title}
        </span>
      </nav>

      <div className="flex flex-col gap-7 lg:grid lg:grid-cols-[minmax(0,1fr)_370px] lg:items-start lg:gap-x-16 lg:pt-6">
        <article className="flex min-w-0 flex-col gap-6 lg:max-w-[740px]">
          <header className="flex flex-col gap-2.5 lg:gap-3">
            <h1 className="text-h1 lg:text-[40px] lg:leading-[46px]" {...englishAttrs(a, "title")}>
              {a.title}
            </h1>
            <p className="flex items-center gap-1 text-caption text-muted">
              <Clock className="size-3.5" strokeWidth={1.75} aria-hidden="true" />
              {common("readTime", { count: readMinutes(a.body_markdown) })}
            </p>
            {a.summary && (
              <p className="text-body-l" {...englishAttrs(a, "summary")}>
                {a.summary}
              </p>
            )}
            <EnglishNote row={a} fields={["title", "summary", "body_markdown"]} />
            <StaleNotice verifiedAt={a.last_verified_at} />
          </header>

          {a.body_markdown.trim() ? (
            <div {...englishAttrs(a, "body_markdown")}>
              <Markdown source={a.body_markdown} />
            </div>
          ) : (
            <p className="rounded-2xl bg-blush p-5 text-body-m">{t("noBody")}</p>
          )}

          <div className="flex flex-col gap-3">
            <ImportantCallout title={t("officialTitle")}>{t("officialText")}</ImportantCallout>
            {a.source_url && (
              <ResourceCard
                title={t("sourceTitle")}
                description={t("sourceText")}
                href={a.source_url}
                source={hostOf(a.source_url)}
                icon={Globe}
              />
            )}
          </div>
        </article>

        <aside className="flex flex-col gap-4 lg:sticky lg:top-28">
          <NextSteps
            items={[t("nextSteps.subject"), t("nextSteps.universities"), t("nextSteps.admissions")]}
            action={{ href: "/universities", label: t("nextSteps.action") }}
          />
          <HelpCallout className="hidden lg:block" />
        </aside>
      </div>
    </Container>
  );
}
