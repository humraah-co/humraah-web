import type { Metadata } from "next";
import { ArrowUpRight, Search } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Container } from "@/components/layout/PageShell";
import { ButtonLink, buttonStyles } from "@/components/ui/Button";
import { Link } from "@/i18n/navigation";
import { alternates } from "@/i18n/metadata";
import { withShare } from "@/i18n/share";
import { localizedPath } from "@/i18n/config";
import { pageLocale, type LocaleParams } from "@/i18n/server";
import { searchSite } from "@/lib/data/search";
import { cleanQuery, totalResults, type SearchKind, type SearchResult } from "@/lib/search";

export async function generateMetadata({ params }: { params: LocaleParams }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "search" });
  // Search results are not worth indexing, and every query would be a new address.
  return withShare(
    { title: t("title"), alternates: alternates("/search", locale), robots: { index: false, follow: true } },
    locale,
  );
}

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

/** Heading of each group: the same names as the main navigation and the resources page. */
const groupTitle: Record<SearchKind, { namespace: "nav" | "resources"; key: string }> = {
  universities: { namespace: "nav", key: "universities" },
  scholarships: { namespace: "nav", key: "scholarships" },
  fields: { namespace: "nav", key: "explore" },
  guidance: { namespace: "nav", key: "guidance" },
  resources: { namespace: "resources", key: "title" },
};

/**
 * The search results (the header's magnifier and the phone Menu both come
 * here with ?q=). Published content only: it reads the same cached lists as
 * the other pages, which use the anon client.
 */
export default async function SearchPage({
  params,
  searchParams,
}: {
  params: LocaleParams;
  searchParams: SearchParams;
}) {
  const locale = await pageLocale(params);
  const t = await getTranslations("search");
  const nav = await getTranslations("nav");
  const resources = await getTranslations("resources");
  const common = await getTranslations("common");
  const query = cleanQuery((await searchParams).q);
  const groups = query ? await searchSite(query, locale) : [];

  const heading = (kind: SearchKind) => {
    const { namespace, key } = groupTitle[kind];
    return namespace === "nav" ? nav(key as "universities") : resources(key as "title");
  };

  return (
    <Container className="flex flex-col gap-6 pt-6 pb-10 lg:gap-8 lg:pt-12 lg:pb-16">
      <div className="flex flex-col gap-3.5">
        <h1 className="text-h1 lg:text-[40px] lg:leading-[46px]">{t("title")}</h1>
        <p className="text-body-m text-muted lg:max-w-[720px] lg:text-body-l">{t("intro")}</p>

        <form
          role="search"
          action={localizedPath("/search", locale)}
          className="flex items-center gap-3 lg:pt-2"
        >
          <label htmlFor="site-search" className="sr-only">
            {t("label")}
          </label>
          <span className="flex h-[52px] min-w-0 flex-1 items-center gap-2.5 rounded-pill border border-border-strong bg-card px-[18px] focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-deep-rose lg:max-w-[560px]">
            <Search className="size-5 shrink-0" strokeWidth={1.75} aria-hidden="true" />
            <input
              id="site-search"
              name="q"
              type="search"
              defaultValue={query}
              maxLength={80}
              placeholder={t("placeholder")}
              autoComplete="off"
              className="min-w-0 flex-1 bg-transparent text-body-m text-charcoal outline-none placeholder:text-muted"
            />
          </span>
          <button type="submit" className={`${buttonStyles.primary} hidden lg:inline-flex`}>
            {nav("search")}
          </button>
        </form>
      </div>

      {!query ? (
        <p role="status" className="rounded-2xl bg-blush p-5 text-body-m">
          {t("prompt")}
        </p>
      ) : groups === null ? (
        <p role="status" className="rounded-2xl bg-tint-lavender p-5 text-body-m">
          {resources("notConnected")}
        </p>
      ) : groups.length === 0 ? (
        <section aria-labelledby="no-results" className="flex flex-col gap-4 rounded-2xl bg-blush p-5">
          <div role="status">
            <h2 id="no-results" className="text-h3">
              {t("noResults", { query })}
            </h2>
          </div>
          <p className="text-body-m text-muted">{t("noResultsHint")}</p>
          <div className="flex flex-col gap-2.5 lg:flex-row lg:gap-3">
            <ButtonLink href="/universities" className="w-full lg:w-auto">
              {nav("universities")}
            </ButtonLink>
            <ButtonLink href="/scholarships" variant="secondary" className="w-full lg:w-auto">
              {nav("scholarships")}
            </ButtonLink>
          </div>
        </section>
      ) : (
        <>
          <p role="status" className="text-label-l">
            {t("count", { count: totalResults(groups), query })}
          </p>
          <div className="flex flex-col gap-8 lg:gap-10">
            {groups.map((group) => (
              <section
                key={group.kind}
                aria-labelledby={`group-${group.kind}`}
                className="flex flex-col gap-3"
              >
                <h2 id={`group-${group.kind}`} className="text-h2">
                  {heading(group.kind)}
                </h2>
                {group.total > group.results.length && (
                  <p className="text-body-s text-muted">
                    {t("showing", { shown: group.results.length, total: group.total })}
                  </p>
                )}
                <ul className="grid gap-3 md:grid-cols-2 lg:gap-4">
                  {group.results.map((r) => (
                    <li key={r.id} className="flex">
                      <ResultLink result={r} opensInNewTab={common("opensInNewTab")} />
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        </>
      )}
    </Container>
  );
}

const cardClasses =
  "group flex w-full flex-col gap-1 rounded-2xl border border-border-soft bg-card p-4 transition-colors hover:bg-blush";

function ResultLink({ result: r, opensInNewTab }: { result: SearchResult; opensInNewTab: string }) {
  const body = (
    <>
      <span className="flex items-start gap-2">
        <span
          className="min-w-0 flex-1 text-label-l"
          {...(r.titleEnglish ? ({ lang: "en", dir: "ltr" } as const) : {})}
        >
          {r.title}
        </span>
        {r.external && <ArrowUpRight className="size-5 shrink-0" strokeWidth={1.75} aria-hidden="true" />}
      </span>
      {r.detail && (
        <span
          className="line-clamp-2 text-body-s text-muted"
          {...(r.detailEnglish ? ({ lang: "en", dir: "ltr" } as const) : {})}
        >
          {r.detail}
        </span>
      )}
    </>
  );
  if (r.external) {
    return (
      <a href={r.href} target="_blank" rel="noopener noreferrer" className={cardClasses}>
        {body}
        <span className="sr-only">{opensInNewTab}</span>
      </a>
    );
  }
  return (
    <Link href={r.href} className={cardClasses}>
      {body}
    </Link>
  );
}
