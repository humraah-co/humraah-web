import type { Metadata } from "next";
import Link from "next/link";
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
} from "@/lib/quiz";
import { pageLocale, type LocaleParams } from "@/i18n/server";

export const metadata: Metadata = {
  title: "Your quiz results",
  description: "Fields of study you might enjoy, based on your answers to the Where do I start? quiz.",
};

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

/** Results are worked out from the answers in the address, so a shared link shows the same results. */
export default async function QuizResultsPage({
  params,
  searchParams,
}: {
  params: LocaleParams;
  searchParams: SearchParams;
}) {
  await pageLocale(params);
  const answers = parseAnswers(await searchParams);
  const fields = await listFields();
  const matches = fields ? scoreFields(answers, fields) : [];
  const answered = questions.filter((q) => answers[q.key].length > 0).length;
  const summary = answerSummary(answers);

  return (
    <>
      <QuizHeader
        title="Your results"
        backHref={questionHref(QUESTION_COUNT, answers)}
        backLabel="Back to the last question"
        action="share"
      />

      <div className="mx-auto flex w-full max-w-[1052px] flex-col gap-5 px-5 pt-4 pb-7 lg:pt-12 lg:pb-20">
        <QuizProgress
          label={
            answered === QUESTION_COUNT
              ? `All ${QUESTION_COUNT} questions answered`
              : `${answered} of ${QUESTION_COUNT} questions answered`
          }
          value={1}
        />

        <header className="flex flex-col gap-2 pt-2 lg:pt-4">
          <p className="text-script text-deep-rose">Here’s what we found</p>
          <h1 className="text-h1 lg:text-[40px] lg:leading-[46px]">You might enjoy…</h1>
          <p className="text-body-m text-muted lg:text-body-l">
            {summary ? `Based on ${summary}.` : "Based on your answers."}
          </p>
        </header>

        {fields === null ? (
          <p className="rounded-2xl bg-tint-lavender p-5 text-body-m" role="status">
            The database isn&apos;t connected yet. Add the Supabase environment variables to see your results.
          </p>
        ) : matches.length === 0 ? (
          <div className="rounded-2xl bg-blush p-5">
            <p className="text-label-l">We need a few more answers to suggest fields.</p>
            <p className="mt-1 text-body-s text-muted">
              Pick what you enjoy and what you’re good at, or{" "}
              <Link
                href="/explore"
                className="text-deep-rose underline underline-offset-2 hover:text-charcoal"
              >
                browse every field
              </Link>
              .
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

        <RememberCallout>
          These are starting points, not final answers. Your interests may change, and that’s part of the
          journey.
        </RememberCallout>

        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:gap-3">
          <ButtonLink href="/explore" className="w-full lg:w-auto">
            {fields && fields.length > 0 ? `Explore all ${fields.length} fields` : "Explore fields"}
          </ButtonLink>
          <ShareButton variant="whatsapp" title="My Humraah quiz results" className="w-full lg:w-auto" />
          <Link href="/quiz" className={`${buttonStyles.text} self-center lg:ml-1`}>
            Retake the quiz
          </Link>
        </div>
      </div>
    </>
  );
}
