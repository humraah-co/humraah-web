import type { Metadata } from "next";
import { ArrowLeft, Check } from "lucide-react";
import { getTranslations } from "next-intl/server";
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
import { localizedPath } from "@/i18n/config";
import { Link } from "@/i18n/navigation";
import { alternates } from "@/i18n/metadata";
import { withShare } from "@/i18n/share";
import { pageLocale, type LocaleParams } from "@/i18n/server";

export async function generateMetadata({ params }: { params: LocaleParams }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "quiz" });
  return withShare(
    { title: t("title"), description: t("metaDescription"), alternates: alternates("/quiz", locale) },
    locale,
  );
}

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

/**
 * One question per page. Each step is a plain GET form: the answers so far
 * travel as hidden fields, so the quiz works without JavaScript and nothing
 * is stored anywhere.
 */
export default async function QuizPage({
  params,
  searchParams,
}: {
  params: LocaleParams;
  searchParams: SearchParams;
}) {
  const locale = await pageLocale(params);
  const t = await getTranslations("quiz");
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
        title={t("title")}
        backHref={backHref}
        backLabel={step > 1 ? t("previousQuestion") : t("backHome")}
        action="exit"
      />

      <div className="mx-auto flex w-full max-w-[800px] flex-col gap-5 px-5 pt-4 pb-28 lg:px-5 lg:pt-12 lg:pb-20">
        <QuizProgress
          label={t("questionOf", { step, total: QUESTION_COUNT })}
          aside={t("duration")}
          value={step / QUESTION_COUNT}
        />

        <form
          id={formId}
          action={localizedPath(last ? "/quiz/results" : "/quiz", locale)}
          className="flex flex-col gap-5"
        >
          {carried.map(([key, value]) => (
            <input key={`${key}-${value}`} type="hidden" name={key} value={value} />
          ))}
          {!last && <input type="hidden" name="step" value={step + 1} />}

          <fieldset className="flex flex-col gap-5">
            <legend className="flex flex-col gap-2 pt-2 lg:pt-4 lg:pb-1">
              <span className="block text-script text-deep-rose">{t("noWrongAnswers")}</span>
              <span className="block text-h1 lg:text-[40px] lg:leading-[46px]">
                {t(`questions.${question.key}.title`)}
              </span>
              <span className="block text-body-m text-muted lg:text-body-l">{t("hint")}</span>
            </legend>
            <div className="mt-5 grid grid-cols-2 gap-3 lg:mt-5 lg:grid-cols-3 lg:gap-x-4">
              {question.options.map((option) => (
                <QuizChoice
                  key={option.value}
                  name={question.key}
                  option={option}
                  label={t(`questions.${question.key}.options.${option.value}`)}
                  checked={selected.includes(option.value)}
                />
              ))}
            </div>
          </fieldset>

          <RememberCallout>{t("remember")}</RememberCallout>

          <div className="hidden items-center justify-between pt-2 lg:flex">
            {step > 1 ? (
              <Link href={backHref} className={buttonStyles.secondary}>
                <ArrowLeft className="size-5" strokeWidth={1.75} aria-hidden="true" />
                {t("back")}
              </Link>
            ) : (
              <span />
            )}
            <button type="submit" className={buttonStyles.primary}>
              {last ? t("seeResults") : t("nextQuestion")}
            </button>
          </div>
        </form>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border-soft bg-card px-5 pt-3 pb-[max(16px,env(safe-area-inset-bottom))] shadow-bottom-bar lg:hidden">
        <button type="submit" form={formId} className={`${buttonStyles.primary} w-full`}>
          {last ? t("seeResults") : t("nextQuestion")}
        </button>
      </div>
    </>
  );
}

/**
 * Quiz/Option and Quiz/Option selected (Figma 4:223, 4:232). A real
 * checkbox, so the whole card is the tap target and it works by keyboard.
 */
function QuizChoice({
  name,
  option,
  label,
  checked,
}: {
  name: string;
  option: QuizOption;
  label: string;
  checked: boolean;
}) {
  const Icon = option.icon;
  return (
    <label className="group flex cursor-pointer items-center gap-2 rounded-2xl border border-border-strong bg-card px-3 py-3.5 text-label-m text-charcoal transition-colors hover:bg-blush has-checked:border-2 has-checked:border-deep-rose has-checked:bg-tint-coral has-checked:px-[11px] has-checked:py-[13px] has-focus-visible:outline-3 has-focus-visible:outline-offset-2 has-focus-visible:outline-deep-rose">
      <input type="checkbox" name={name} value={option.value} defaultChecked={checked} className="sr-only" />
      <Icon
        className="size-5 shrink-0 group-has-checked:text-deep-rose"
        strokeWidth={1.75}
        aria-hidden="true"
      />
      <span className="min-w-0 flex-1">{label}</span>
      <Check
        className="hidden size-[18px] shrink-0 text-deep-rose group-has-checked:block"
        strokeWidth={2}
        aria-hidden="true"
      />
    </label>
  );
}
