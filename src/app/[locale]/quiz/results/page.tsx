import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { FieldCard } from "@/components/content/Cards";
import { QuizHeader, QuizProgress } from "@/components/quiz/QuizHeader";
import { RememberCallout } from "@/components/ui/Blocks";
import { ButtonLink, buttonStyles } from "@/components/ui/Button";
import { ShareButton } from "@/components/ui/ShareButton";
import { listFields } from "@/lib/data/public";
import {
  answerSummary,
  parseAnswers,
  QUESTION_COUNT,
  questionHref,
  questions,
  scoreFields,
  type QuizT,
} from "@/lib/quiz";
import { Link } from "@/i18n/navigation";
import { alternates } from "@/i18n/metadata";
import { withShare } from "@/i18n/share";
import { pageLocale, type LocaleParams } from "@/i18n/server";

export async function generateMetadata({ params }: { params: LocaleParams }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "quiz.results" });
  return withShare(
    {
      title: t("metaTitle"),
      description: t("metaDescription"),
      alternates: alternates("/quiz/results", locale),
    },
    locale,
  );
}

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

/** Results are worked out from the answers in the address, so a shared link shows the same results. */
export default async function QuizResultsPage({
  params,
  searchParams,
}: {
  params: LocaleParams;
  searchParams: SearchParams;
}) {
  const locale = await pageLocale(params);
  const quiz = await getTranslations("quiz");
  const t = await getTranslations("quiz.results");
  const answers = parseAnswers(await searchParams);
  const fields = await listFields(locale);
  // The quiz helpers look up keys built from question and option names, so they take the
  // translator loosely typed.
  const quizT = quiz as unknown as QuizT;
  const matches = fields ? scoreFields(answers, fields, quizT, locale) : [];
  const answered = questions.filter((q) => answers[q.key].length > 0).length;
  const summary = answerSummary(answers, quizT, locale);

  return (
    <>
      <QuizHeader
        title={t("title")}
        backHref={questionHref(QUESTION_COUNT, answers)}
        backLabel={t("backLabel")}
        action="share"
      />

      <div className="mx-auto flex w-full max-w-[1052px] flex-col gap-5 px-5 pt-4 pb-7 lg:pt-12 lg:pb-20">
        <QuizProgress
          label={
            answered === QUESTION_COUNT
              ? t("allAnswered", { total: QUESTION_COUNT })
              : t("someAnswered", { answered, total: QUESTION_COUNT })
          }
          value={1}
        />

        <header className="flex flex-col gap-2 pt-2 lg:pt-4">
          <p className="text-script text-deep-rose">{t("script")}</p>
          <h1 className="text-h1 lg:text-[40px] lg:leading-[46px]">{t("heading")}</h1>
          <p className="text-body-m text-muted lg:text-body-l">
            {summary ? t("basedOn", { summary }) : t("basedOnAnswers")}
          </p>
        </header>

        {fields === null ? (
          <p className="rounded-2xl bg-tint-lavender p-5 text-body-m" role="status">
            {t("notConnected")}
          </p>
        ) : matches.length === 0 ? (
          <div className="rounded-2xl bg-blush p-5">
            <p className="text-label-l">{t("needMore")}</p>
            <p className="mt-1 text-body-s text-muted">
              {t.rich("needMoreHint", {
                explore: (chunks) => (
                  <Link
                    href="/explore"
                    className="text-deep-rose underline underline-offset-2 hover:text-charcoal"
                  >
                    {chunks}
                  </Link>
                ),
              })}
            </p>
          </div>
        ) : (
          <ul className="grid gap-3.5 lg:grid-cols-3 lg:gap-4">
            {matches.map((m) => (
              <li key={m.field.id} className="flex flex-col *:flex-1">
                <FieldCard field={m.field} reason={m.reason} />
              </li>
            ))}
          </ul>
        )}

        <RememberCallout>{t("remember")}</RememberCallout>

        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:gap-3">
          <ButtonLink href="/explore" className="w-full lg:w-auto">
            {fields && fields.length > 0 ? t("exploreAll", { count: fields.length }) : t("explore")}
          </ButtonLink>
          <ShareButton variant="whatsapp" title={t("shareTitle")} className="w-full lg:w-auto" />
          <Link href="/quiz" className={`${buttonStyles.text} self-center lg:ms-1`}>
            {t("retake")}
          </Link>
        </div>
      </div>
    </>
  );
}
