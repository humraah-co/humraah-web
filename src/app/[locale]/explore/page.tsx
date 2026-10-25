import type { Metadata } from "next";
import { Search } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { FieldCard } from "@/components/content/Cards";
import { Container } from "@/components/layout/PageShell";
import { TwoColumns } from "@/components/layout/TwoColumns";
import { RememberCallout } from "@/components/ui/Blocks";
import { buttonStyles } from "@/components/ui/Button";
import { listFields, type FieldSummary } from "@/lib/data/public";
import { countWord } from "@/lib/format";
import { Link } from "@/i18n/navigation";
import { pageLocale, type LocaleParams } from "@/i18n/server";

export async function generateMetadata({ params }: { params: LocaleParams }): Promise<Metadata> {
  const t = await getTranslations({ locale: (await params).locale, namespace: "explore" });
  return { title: t("metaTitle"), description: t("metaDescription") };
}

/** Case-insensitive match on the field name, summary, interests and example programmes. */
function matches(field: FieldSummary, query: string) {
  const haystack = [
    field.name,
    field.summary,
    field.you_might_enjoy,
    ...field.interests,
    ...field.example_programmes,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return query
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .every((word) => haystack.includes(word));
}

export default async function ExplorePage({
  params,
  searchParams,
}: {
  params: LocaleParams;
  searchParams: Promise<{ q?: string | string[] }>;
}) {
  await pageLocale(params);
  const t = await getTranslations("explore");
  const { q } = await searchParams;
  const query = (Array.isArray(q) ? q[0] : q)?.trim() ?? "";

  const fields = await listFields();
  const shown = fields && query ? fields.filter((f) => matches(f, query)) : fields;

  return (
    <>
      {/* The quiz box sits beside the heading from 1280 px; below that it runs full width underneath. */}
      <Container className="flex flex-col gap-3 pt-6 pb-2 lg:gap-6 lg:pt-12 lg:pb-8 xl:flex-row xl:items-end xl:gap-12">
        <div className="flex flex-col gap-3 lg:gap-3.5 xl:flex-1">
          <h1 className="text-h1 lg:text-[40px] lg:leading-[46px]">{t("title")}</h1>
          <p className="max-w-[640px] text-body-m text-muted lg:text-body-l">
            {fields && fields.length > 0
              ? t("intro", { count: fields.length, word: countWord(fields.length) })
              : t("introEmpty")}
          </p>
          <form role="search" action="/explore" className="w-full lg:w-[560px]">
            <label htmlFor="field-search" className="sr-only">
              {t("search")}
            </label>
            <span className="flex h-[52px] items-center gap-2.5 rounded-pill border border-border-strong bg-card px-[18px]">
              <Search className="size-5 shrink-0" strokeWidth={1.75} aria-hidden="true" />
              <input
                id="field-search"
                name="q"
                type="search"
                defaultValue={query}
                placeholder={t("search")}
                autoComplete="off"
                className="min-w-0 flex-1 bg-transparent text-body-m text-charcoal outline-none placeholder:text-muted"
              />
            </span>
          </form>
        </div>

        <aside className="flex items-center gap-3 rounded-[20px] bg-lavender p-4 lg:gap-6 lg:rounded-3xl lg:p-6 xl:w-[420px] xl:shrink-0 xl:flex-col xl:items-start xl:gap-2.5">
          <div className="flex min-w-0 flex-1 flex-col gap-0.5 lg:gap-1.5 xl:flex-none xl:gap-2.5">
            <p className="text-script">{t("quizTitle")}</p>
            <p className="text-body-s lg:text-body-m">
              <span className="lg:hidden">{t("quizTextShort")}</span>
              <span className="hidden lg:inline">{t("quizTextLong")}</span>
            </p>
          </div>
          <Link href="/quiz" className={`${buttonStyles.small} shrink-0`}>
            {t("quizLink")}
          </Link>
        </aside>
      </Container>

      <Container className="pt-3 pb-2 lg:pt-2 lg:pb-6">
        {fields === null ? (
          <p className="rounded-2xl bg-tint-lavender p-5 text-body-m" role="status">
            {t("notConnected")}
          </p>
        ) : fields.length === 0 ? (
          <p className="rounded-2xl bg-blush p-5 text-body-m">{t("noFields")}</p>
        ) : shown && shown.length === 0 ? (
          <div className="rounded-2xl bg-blush p-5" role="status">
            <p className="text-label-l">{t("noMatch", { query })}</p>
            <p className="mt-1 text-body-s text-muted">
              {t("noMatchHint")}{" "}
              <Link
                href="/explore"
                className="text-deep-rose underline underline-offset-2 hover:text-charcoal"
              >
                {t("showAllFields")}
              </Link>
            </p>
          </div>
        ) : (
          <>
            {query && (
              <p className="mb-3 text-body-s text-muted" role="status">
                {t("matches", { count: shown!.length, query })}{" "}
                <Link
                  href="/explore"
                  className="text-deep-rose underline underline-offset-2 hover:text-charcoal"
                >
                  {t("showAll")}
                </Link>
              </p>
            )}
            <TwoColumns
              items={shown!.map((field) => ({ key: field.id, node: <FieldCard field={field} /> }))}
            />
          </>
        )}
      </Container>

      <Container className="pt-2 pb-7 lg:pb-16">
        <RememberCallout>{t("remember")}</RememberCallout>
      </Container>
    </>
  );
}
