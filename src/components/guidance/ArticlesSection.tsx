import { ChevronRight, Clock } from "lucide-react";
import { useTranslations } from "next-intl";
import { englishAttrs } from "@/components/ui/InEnglish";
import { CardGrid } from "@/components/layout/CardGrid";
import { HelpCallout } from "@/components/ui/Blocks";
import type { GuidanceSummary } from "@/lib/data/public";
import { readMinutes } from "@/lib/format";
import { Link } from "@/i18n/navigation";
import { ArticleIcon } from "./ArticleIcon";
import { cardStyles } from "@/components/ui/cardStyles";

/**
 * The articles part of the Guidance page. `articles` is null when the
 * database isn't connected. Cards in a row share a height, titles clamp to
 * two lines and summaries to three; the full text is on the article page.
 */
export function ArticlesSection({ articles }: { articles: GuidanceSummary[] | null }) {
  const t = useTranslations("guidance");
  const common = useTranslations("common");
  return (
    <section id="articles" aria-labelledby="articles-heading" className="scroll-mt-24 lg:scroll-mt-28">
      <h2 id="articles-heading" className="text-h2 lg:text-[40px] lg:leading-[46px]">
        {t("articlesTitle")}
      </h2>
      <p className="mt-2 text-body-m text-muted lg:mt-3 lg:max-w-[720px] lg:text-body-l">
        {t("articlesIntro")}
      </p>

      {articles === null ? (
        <>
          <p className="mt-5 rounded-2xl bg-tint-lavender p-5 text-body-m" role="status">
            {t("notConnected")}
          </p>
          <div className="mt-5 lg:max-w-[560px]">
            <HelpCallout />
          </div>
        </>
      ) : articles.length === 0 ? (
        <>
          <p className="mt-5 rounded-2xl bg-blush p-5 text-body-m">{t("noArticles")}</p>
          <div className="mt-5 lg:max-w-[560px]">
            <HelpCallout />
          </div>
        </>
      ) : (
        <div className="mt-5 lg:mt-6">
          <CardGrid
            items={[
              ...articles.map((a, i) => ({
                key: a.id,
                node: (
                  <Link
                    href={`/guidance/${a.slug}`}
                    className={`group flex h-full w-full min-w-0 items-start ${cardStyles.gap} ${cardStyles.shape} bg-card ${cardStyles.hover}`}
                  >
                    <ArticleIcon slug={a.slug} index={i} />
                    <span className="flex min-w-0 flex-1 flex-col gap-1 self-stretch">
                      <span className="line-clamp-2 text-label-l" {...englishAttrs(a, "title")}>
                        {a.title}
                      </span>
                      {a.summary && (
                        <span className="line-clamp-3 text-body-s text-muted" {...englishAttrs(a, "summary")}>
                          {a.summary}
                        </span>
                      )}
                      <span className="mt-auto flex items-center gap-1 pt-1 text-caption text-muted">
                        <Clock className="size-3.5" strokeWidth={1.75} aria-hidden="true" />
                        {common("readTime", { count: readMinutes(a.body_markdown) })}
                      </span>
                    </span>
                    <ChevronRight className="mt-3 size-5 shrink-0" strokeWidth={1.75} aria-hidden="true" />
                  </Link>
                ),
              })),
              // Always the last cell, so it moves down with the grid when an article is added.
              { key: "help", node: <HelpCallout card /> },
            ]}
          />
        </div>
      )}
    </section>
  );
}
