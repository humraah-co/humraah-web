import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Check } from "lucide-react";
import { QuizHeader, QuizProgress } from "@/components/quiz/QuizHeader";
import { RememberCallout } from "@/components/ui/Blocks";
import { buttonStyles } from "@/components/ui/Button";
import {
  answerParams,
  parseAnswers,
  parseStep,
  QUESTION_COUNT,
  questionHref,
  questions,
  type QuizOption,
} from "@/lib/quiz";

export const metadata: Metadata = {
  title: "Where do I start?",
  description:
    "Six quick questions about what you enjoy and what you're good at, and fields of study to explore.",
};

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

/**
 * One question per page. Each step is a plain GET form: the answers so far
 * travel as hidden fields, so the quiz works without JavaScript and nothing
 * is stored anywhere.
 */
export default async function QuizPage({ searchParams }: { searchParams: SearchParams }) {
  const raw = await searchParams;
  const step = parseStep(raw);
  const answers = parseAnswers(raw);
  const question = questions[step - 1];
  const selected = answers[question.key];
  const last = step === QUESTION_COUNT;
  const backHref = step > 1 ? questionHref(step - 1, answers) : "/";
  const carried = [...answerParams(answers, question.key).entries()];
  const formId = "quiz-form";

  return (
    <>
      <QuizHeader
        title="Where do I start?"
        backHref={backHref}
        backLabel={step > 1 ? "Previous question" : "Back to home"}
        action="exit"
      />

      <div className="mx-auto flex w-full max-w-[800px] flex-col gap-5 px-5 pt-4 pb-28 lg:px-5 lg:pt-12 lg:pb-20">
        <QuizProgress
          label={`Question ${step} of ${QUESTION_COUNT}`}
          aside="About 2 minutes"
          value={step / QUESTION_COUNT}
        />

        <form id={formId} action={last ? "/quiz/results" : "/quiz"} className="flex flex-col gap-5">
          {carried.map(([key, value]) => (
            <input key={`${key}-${value}`} type="hidden" name={key} value={value} />
          ))}
          {!last && <input type="hidden" name="step" value={step + 1} />}

          <fieldset className="flex flex-col gap-5">
            <legend className="flex flex-col gap-2 pt-2 lg:pt-4 lg:pb-1">
              <span className="block text-script text-deep-rose">There are no wrong answers</span>
              <span className="block text-h1 lg:text-[40px] lg:leading-[46px]">{question.title}</span>
              <span className="block text-body-m text-muted lg:text-body-l">{question.hint}</span>
            </legend>
            <div className="mt-5 grid grid-cols-2 gap-3 lg:mt-5 lg:grid-cols-3 lg:gap-x-4">
              {question.options.map((option) => (
                <QuizChoice
                  key={option.value}
                  name={question.key}
                  option={option}
                  checked={selected.includes(option.value)}
                />
              ))}
            </div>
          </fieldset>

          <RememberCallout>
            You don’t have to know what you want to become yet. This just gives you a place to start.
          </RememberCallout>

          <div className="hidden items-center justify-between pt-2 lg:flex">
            {step > 1 ? (
              <Link href={backHref} className={buttonStyles.secondary}>
                <ArrowLeft className="size-5" strokeWidth={1.75} aria-hidden="true" />
                Back
              </Link>
            ) : (
              <span />
            )}
            <button type="submit" className={buttonStyles.primary}>
              {last ? "See my results" : "Next question"}
            </button>
          </div>
        </form>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border-soft bg-card px-5 pt-3 pb-[max(16px,env(safe-area-inset-bottom))] shadow-bottom-bar lg:hidden">
        <button type="submit" form={formId} className={`${buttonStyles.primary} w-full`}>
          {last ? "See my results" : "Next question"}
        </button>
      </div>
    </>
  );
}

/**
 * Quiz/Option and Quiz/Option selected (Figma 4:223, 4:232). A real
 * checkbox, so the whole card is the tap target and it works by keyboard.
 */
function QuizChoice({ name, option, checked }: { name: string; option: QuizOption; checked: boolean }) {
  const Icon = option.icon;
  return (
    <label className="group flex cursor-pointer items-center gap-2 rounded-2xl border border-border-strong bg-card px-3 py-3.5 text-label-m text-charcoal transition-colors hover:bg-blush has-checked:border-2 has-checked:border-deep-rose has-checked:bg-tint-coral has-checked:px-[11px] has-checked:py-[13px] has-focus-visible:outline-3 has-focus-visible:outline-offset-2 has-focus-visible:outline-deep-rose">
      <input type="checkbox" name={name} value={option.value} defaultChecked={checked} className="sr-only" />
      <Icon
        className="size-5 shrink-0 group-has-checked:text-deep-rose"
        strokeWidth={1.75}
        aria-hidden="true"
      />
      <span className="min-w-0 flex-1">{option.label}</span>
      <Check
        className="hidden size-[18px] shrink-0 text-deep-rose group-has-checked:block"
        strokeWidth={2}
        aria-hidden="true"
      />
    </label>
  );
}
