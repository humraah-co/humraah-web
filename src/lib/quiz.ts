import {
  Atom,
  BookOpen,
  BookOpenText,
  Briefcase,
  Brain,
  Brush,
  Building,
  Calculator,
  Camera,
  CircleQuestionMark,
  ClipboardList,
  Dna,
  Ear,
  FlaskConical,
  Gavel,
  GraduationCap,
  Hand,
  HandHeart,
  HardHat,
  Heart,
  HeartHandshake,
  Image,
  Landmark,
  Laptop,
  Lightbulb,
  MessageCircle,
  MessagesSquare,
  Microscope,
  Monitor,
  MonitorPlay,
  Palette,
  PenLine,
  Pencil,
  Plus,
  Presentation,
  Puzzle,
  Rocket,
  Scale,
  School,
  Search,
  Sigma,
  Sparkles,
  Sprout,
  Stethoscope,
  Telescope,
  TestTube,
  TrendingUp,
  Users,
  Wallet,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import type { FieldSummary } from "@/lib/data/public";
import { joinWithAnd } from "@/lib/format";
import type { Locale } from "@/i18n/config";
import { many, type RawParams } from "@/lib/universityFilters";

/**
 * "Where do I start?" quiz. Six questions; every answer adds points to one or
 * more of the ten fields of study (by slug). Answers live in the page address
 * (?q1=science&q1=maths&q2=…), so nothing is saved and a result can be shared.
 */

type FieldSlug =
  | "business-management"
  | "engineering"
  | "computing-technology"
  | "medicine-health"
  | "social-behavioural-sciences"
  | "humanities-languages"
  | "arts-design-architecture"
  | "natural-applied-sciences"
  | "law"
  | "education";

/**
 * The wording is in the messages, under "quiz.questions.<key>": its title,
 * each option's label (options.<value>), how it reads in a sentence
 * (phrases.<value>) and the clause that starts a result's reason
 * ("you enjoy {things}").
 */
export type QuizOption = {
  value: string;
  icon: LucideIcon;
  points: Partial<Record<FieldSlug, number>>;
};

export type QuizQuestion = {
  /** The query-string key: q1 … q6. */
  key: string;
  options: QuizOption[];
};

/** The "quiz" messages, from useTranslations("quiz") or getTranslations("quiz"). */
export type QuizT = (key: string, values?: Record<string, string>) => string;

export const questions: QuizQuestion[] = [
  {
    key: "q1",
    options: [
      {
        value: "science",
        icon: FlaskConical,
        points: { "natural-applied-sciences": 2, "medicine-health": 1, engineering: 1 },
      },
      {
        value: "maths",
        icon: Plus,
        points: {
          engineering: 2,
          "computing-technology": 1,
          "natural-applied-sciences": 1,
          "business-management": 1,
        },
      },
      {
        value: "languages",
        icon: MessageCircle,
        points: { "humanities-languages": 2, education: 1, law: 1 },
      },
      {
        value: "art",
        icon: Palette,
        points: { "arts-design-architecture": 3 },
      },
      {
        value: "technology",
        icon: Monitor,
        points: { "computing-technology": 3, engineering: 1 },
      },
      { value: "business", icon: Briefcase, points: { "business-management": 3 } },
      {
        value: "helping",
        icon: Heart,
        points: { "medicine-health": 2, education: 1, "social-behavioural-sciences": 1 },
      },
      {
        value: "society",
        icon: Users,
        points: { "social-behavioural-sciences": 2, law: 1, "humanities-languages": 1 },
      },
      {
        value: "nature",
        icon: Sprout,
        points: { "natural-applied-sciences": 2, engineering: 1 },
      },
      { value: "other", icon: Pencil, points: {} },
    ],
  },
  {
    key: "q2",
    options: [
      {
        value: "problems",
        icon: Puzzle,
        points: { engineering: 2, "computing-technology": 2 },
      },
      { value: "explaining", icon: Presentation, points: { education: 3 } },
      { value: "writing", icon: PenLine, points: { "humanities-languages": 2, law: 1 } },
      {
        value: "numbers",
        icon: Calculator,
        points: { "business-management": 2, "natural-applied-sciences": 1 },
      },
      {
        value: "drawing",
        icon: Brush,
        points: { "arts-design-architecture": 3 },
      },
      { value: "building", icon: Wrench, points: { engineering: 3 } },
      {
        value: "organising",
        icon: ClipboardList,
        points: { "business-management": 2 },
      },
      {
        value: "listening",
        icon: Ear,
        points: { "social-behavioural-sciences": 2, "medicine-health": 1 },
      },
      { value: "debating", icon: Scale, points: { law: 3 } },
      {
        value: "research",
        icon: Search,
        points: { "natural-applied-sciences": 2, "social-behavioural-sciences": 1 },
      },
    ],
  },
  {
    key: "q3",
    options: [
      {
        value: "biology",
        icon: Dna,
        points: { "medicine-health": 2, "natural-applied-sciences": 1 },
      },
      {
        value: "chemistry",
        icon: FlaskConical,
        points: { "natural-applied-sciences": 2, "medicine-health": 1 },
      },
      {
        value: "physics",
        icon: Atom,
        points: { engineering: 2, "natural-applied-sciences": 1 },
      },
      {
        value: "maths",
        icon: Sigma,
        points: { engineering: 1, "computing-technology": 1, "business-management": 1 },
      },
      {
        value: "computer",
        icon: Laptop,
        points: { "computing-technology": 3 },
      },
      {
        value: "english-urdu",
        icon: BookOpen,
        points: { "humanities-languages": 2, education: 1 },
      },
      {
        value: "history",
        icon: Landmark,
        points: { "humanities-languages": 1, law: 1, "social-behavioural-sciences": 1 },
      },
      {
        value: "economics",
        icon: TrendingUp,
        points: { "business-management": 3 },
      },
      { value: "art", icon: Palette, points: { "arts-design-architecture": 3 } },
      {
        value: "psychology",
        icon: Brain,
        points: { "social-behavioural-sciences": 3 },
      },
    ],
  },
  {
    key: "q4",
    options: [
      {
        value: "hospital",
        icon: Stethoscope,
        points: { "medicine-health": 3 },
      },
      {
        value: "office",
        icon: Building,
        points: { "business-management": 2, law: 1 },
      },
      {
        value: "lab",
        icon: Microscope,
        points: { "natural-applied-sciences": 2, "medicine-health": 1 },
      },
      {
        value: "classroom",
        icon: School,
        points: { education: 3 },
      },
      { value: "court", icon: Gavel, points: { law: 3 } },
      {
        value: "studio",
        icon: Camera,
        points: { "arts-design-architecture": 3 },
      },
      {
        value: "site",
        icon: HardHat,
        points: { engineering: 2, "natural-applied-sciences": 1 },
      },
      {
        value: "online",
        icon: Laptop,
        points: { "computing-technology": 2, "business-management": 1 },
      },
      {
        value: "community",
        icon: HeartHandshake,
        points: { "social-behavioural-sciences": 2, education: 1 },
      },
      { value: "unsure", icon: CircleQuestionMark, points: {} },
    ],
  },
  {
    key: "q5",
    options: [
      {
        value: "helping",
        icon: HandHeart,
        points: { "medicine-health": 2, "social-behavioural-sciences": 1, education: 1 },
      },
      {
        value: "creating",
        icon: Sparkles,
        points: { "arts-design-architecture": 2, engineering: 1, "computing-technology": 1 },
      },
      {
        value: "fairness",
        icon: Scale,
        points: { law: 3, "social-behavioural-sciences": 1 },
      },
      {
        value: "discovery",
        icon: Telescope,
        points: { "natural-applied-sciences": 2, engineering: 1 },
      },
      {
        value: "earning",
        icon: Wallet,
        points: { "business-management": 2, "computing-technology": 1, "medicine-health": 1 },
      },
      {
        value: "sharing",
        icon: GraduationCap,
        points: { education: 3 },
      },
      {
        value: "ideas",
        icon: Lightbulb,
        points: { "humanities-languages": 2, "social-behavioural-sciences": 1 },
      },
      {
        value: "future",
        icon: Rocket,
        points: { "computing-technology": 2, engineering: 2 },
      },
    ],
  },
  {
    key: "q6",
    options: [
      {
        value: "hands-on",
        icon: Hand,
        points: { engineering: 2, "medicine-health": 1, "arts-design-architecture": 1 },
      },
      {
        value: "reading",
        icon: BookOpenText,
        points: { "humanities-languages": 2, law: 1 },
      },
      {
        value: "talking",
        icon: MessagesSquare,
        points: { "social-behavioural-sciences": 1, education: 1, law: 1 },
      },
      {
        value: "experiments",
        icon: TestTube,
        points: { "natural-applied-sciences": 2, "medicine-health": 1 },
      },
      {
        value: "computers",
        icon: MonitorPlay,
        points: { "computing-technology": 2 },
      },
      {
        value: "visual",
        icon: Image,
        points: { "arts-design-architecture": 2, engineering: 1 },
      },
      {
        value: "projects",
        icon: Briefcase,
        points: { "business-management": 2, engineering: 1 },
      },
    ],
  },
];

export const QUESTION_COUNT = questions.length;

/** Answers by question key, keeping only values that are real options. */
export type QuizAnswers = Record<string, string[]>;

export function parseAnswers(raw: RawParams): QuizAnswers {
  const answers: QuizAnswers = {};
  for (const q of questions) {
    const chosen = new Set(many(raw[q.key]));
    answers[q.key] = q.options.filter((o) => chosen.has(o.value)).map((o) => o.value);
  }
  return answers;
}

/** Step 1 to 6; anything else reads as 1. */
export function parseStep(raw: RawParams) {
  const step = Number.parseInt(many(raw.step)[0] ?? "", 10);
  return Number.isInteger(step) && step >= 1 && step <= QUESTION_COUNT ? step : 1;
}

/** The answers as query parameters, optionally leaving one question out. */
export function answerParams(answers: QuizAnswers, except?: string) {
  const params = new URLSearchParams();
  for (const q of questions) {
    if (q.key === except) continue;
    for (const value of answers[q.key] ?? []) params.append(q.key, value);
  }
  return params;
}

export function questionHref(step: number, answers: QuizAnswers) {
  const params = answerParams(answers);
  if (step > 1) params.set("step", String(step));
  const query = params.toString();
  return query ? `/quiz?${query}` : "/quiz";
}

export function resultsHref(answers: QuizAnswers) {
  const query = answerParams(answers).toString();
  return query ? `/quiz/results?${query}` : "/quiz/results";
}

function chosenOptions(q: QuizQuestion, answers: QuizAnswers) {
  return q.options.filter((o) => answers[q.key]?.includes(o.value));
}

const phraseOf = (t: QuizT, q: QuizQuestion, o: QuizOption) => t(`questions.${q.key}.phrases.${o.value}`);

/** "what you enjoy (science and technology) and what you’re good at (writing)". */
export function answerSummary(answers: QuizAnswers, t: QuizT, locale: Locale = "en") {
  const parts = questions
    .slice(0, 2)
    .map((q) => ({ q, options: chosenOptions(q, answers).filter((o) => Object.keys(o.points).length > 0) }))
    .filter((p) => p.options.length > 0)
    .map(({ q, options }) =>
      t(`summary.${q.key}`, {
        things: joinWithAnd(
          options.map((o) => phraseOf(t, q, o)),
          locale,
        ),
      }),
    );
  return parts.length > 0 ? joinWithAnd(parts, locale) : null;
}

export type FieldMatch = { field: FieldSummary; score: number; reason: string };

/**
 * The best three fields for these answers, with a short reason for each.
 * Ties keep the order the fields are listed in. Fields that score nothing
 * are left out.
 */
export function scoreFields(
  answers: QuizAnswers,
  fields: FieldSummary[],
  t: QuizT,
  locale: Locale = "en",
  limit = 3,
): FieldMatch[] {
  return fields
    .map((field, order) => {
      const contributions: { question: number; option: QuizOption; points: number }[] = [];
      questions.forEach((q, question) => {
        for (const option of chosenOptions(q, answers)) {
          const points = option.points[field.slug as FieldSlug] ?? 0;
          if (points > 0) contributions.push({ question, option, points });
        }
      });
      const score = contributions.reduce((sum, c) => sum + c.points, 0);
      return { field, order, score, reason: reasonFrom(contributions, t, locale) };
    })
    .filter((m) => m.score > 0)
    .sort((a, b) => b.score - a.score || a.order - b.order)
    .slice(0, limit)
    .map(({ field, score, reason }) => ({ field, score, reason }));
}

/** "Because you enjoy technology and you’re good at solving problems." from the two strongest answers. */
function reasonFrom(
  contributions: { question: number; option: QuizOption; points: number }[],
  t: QuizT,
  locale: Locale,
) {
  const top = [...contributions]
    .sort((a, b) => b.points - a.points || a.question - b.question)
    .slice(0, 2)
    .sort((a, b) => a.question - b.question);
  const clause = (question: number, things: string) =>
    t(`questions.${questions[question].key}.clause`, { things });
  const clauses: string[] = [];
  for (let i = 0; i < top.length; i++) {
    const { question, option } = top[i];
    const q = questions[question];
    if (i > 0 && top[i - 1].question === question) {
      clauses[clauses.length - 1] = clause(
        question,
        joinWithAnd([phraseOf(t, q, top[i - 1].option), phraseOf(t, q, option)], locale),
      );
    } else {
      clauses.push(clause(question, phraseOf(t, q, option)));
    }
  }
  return t("reason", { clauses: joinWithAnd(clauses, locale) });
}
