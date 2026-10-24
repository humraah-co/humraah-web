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

export type QuizOption = {
  value: string;
  label: string;
  icon: LucideIcon;
  /** How the answer reads in a sentence; defaults to the label in lower case. */
  phrase?: string;
  points: Partial<Record<FieldSlug, number>>;
};

export type QuizQuestion = {
  /** The query-string key: q1 … q6. */
  key: string;
  title: string;
  hint: string;
  /** Starts the reason on a result card, e.g. "you enjoy" technology. */
  verb: string;
  options: QuizOption[];
};

const hint = "Pick as many as you like. You can change your answers later.";

export const questions: QuizQuestion[] = [
  {
    key: "q1",
    title: "What do you enjoy?",
    hint,
    verb: "you enjoy",
    options: [
      {
        value: "science",
        label: "Science",
        icon: FlaskConical,
        points: { "natural-applied-sciences": 2, "medicine-health": 1, engineering: 1 },
      },
      {
        value: "maths",
        label: "Maths",
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
        label: "Languages",
        icon: MessageCircle,
        points: { "humanities-languages": 2, education: 1, law: 1 },
      },
      {
        value: "art",
        label: "Art and creativity",
        icon: Palette,
        points: { "arts-design-architecture": 3 },
      },
      {
        value: "technology",
        label: "Technology",
        icon: Monitor,
        points: { "computing-technology": 3, engineering: 1 },
      },
      { value: "business", label: "Business", icon: Briefcase, points: { "business-management": 3 } },
      {
        value: "helping",
        label: "Helping people",
        icon: Heart,
        points: { "medicine-health": 2, education: 1, "social-behavioural-sciences": 1 },
      },
      {
        value: "society",
        label: "People and society",
        icon: Users,
        points: { "social-behavioural-sciences": 2, law: 1, "humanities-languages": 1 },
      },
      {
        value: "nature",
        label: "Nature and environment",
        icon: Sprout,
        points: { "natural-applied-sciences": 2, engineering: 1 },
      },
      { value: "other", label: "Something else", icon: Pencil, phrase: "other things", points: {} },
    ],
  },
  {
    key: "q2",
    title: "What are you good at?",
    hint,
    verb: "you’re good at",
    options: [
      {
        value: "problems",
        label: "Solving problems",
        icon: Puzzle,
        points: { engineering: 2, "computing-technology": 2 },
      },
      { value: "explaining", label: "Explaining things", icon: Presentation, points: { education: 3 } },
      { value: "writing", label: "Writing", icon: PenLine, points: { "humanities-languages": 2, law: 1 } },
      {
        value: "numbers",
        label: "Working with numbers",
        icon: Calculator,
        points: { "business-management": 2, "natural-applied-sciences": 1 },
      },
      {
        value: "drawing",
        label: "Drawing and design",
        icon: Brush,
        points: { "arts-design-architecture": 3 },
      },
      { value: "building", label: "Building and fixing things", icon: Wrench, points: { engineering: 3 } },
      {
        value: "organising",
        label: "Organising and planning",
        icon: ClipboardList,
        points: { "business-management": 2 },
      },
      {
        value: "listening",
        label: "Listening to people",
        icon: Ear,
        points: { "social-behavioural-sciences": 2, "medicine-health": 1 },
      },
      { value: "debating", label: "Debating and persuading", icon: Scale, points: { law: 3 } },
      {
        value: "research",
        label: "Finding things out",
        icon: Search,
        points: { "natural-applied-sciences": 2, "social-behavioural-sciences": 1 },
      },
    ],
  },
  {
    key: "q3",
    title: "Which subjects do you like most?",
    hint,
    verb: "you like",
    options: [
      {
        value: "biology",
        label: "Biology",
        icon: Dna,
        points: { "medicine-health": 2, "natural-applied-sciences": 1 },
      },
      {
        value: "chemistry",
        label: "Chemistry",
        icon: FlaskConical,
        points: { "natural-applied-sciences": 2, "medicine-health": 1 },
      },
      {
        value: "physics",
        label: "Physics",
        icon: Atom,
        points: { engineering: 2, "natural-applied-sciences": 1 },
      },
      {
        value: "maths",
        label: "Maths",
        icon: Sigma,
        points: { engineering: 1, "computing-technology": 1, "business-management": 1 },
      },
      {
        value: "computer",
        label: "Computer science",
        icon: Laptop,
        points: { "computing-technology": 3 },
      },
      {
        value: "english-urdu",
        label: "English or Urdu",
        icon: BookOpen,
        phrase: "English or Urdu",
        points: { "humanities-languages": 2, education: 1 },
      },
      {
        value: "history",
        label: "History and Pakistan Studies",
        icon: Landmark,
        phrase: "history and Pakistan Studies",
        points: { "humanities-languages": 1, law: 1, "social-behavioural-sciences": 1 },
      },
      {
        value: "economics",
        label: "Economics or accounting",
        icon: TrendingUp,
        points: { "business-management": 3 },
      },
      { value: "art", label: "Art", icon: Palette, points: { "arts-design-architecture": 3 } },
      {
        value: "psychology",
        label: "Psychology or sociology",
        icon: Brain,
        points: { "social-behavioural-sciences": 3 },
      },
    ],
  },
  {
    key: "q4",
    title: "Where can you picture yourself working?",
    hint,
    verb: "you can picture yourself",
    options: [
      {
        value: "hospital",
        label: "A hospital or clinic",
        icon: Stethoscope,
        phrase: "in a hospital or clinic",
        points: { "medicine-health": 3 },
      },
      {
        value: "office",
        label: "An office",
        icon: Building,
        phrase: "in an office",
        points: { "business-management": 2, law: 1 },
      },
      {
        value: "lab",
        label: "A lab",
        icon: Microscope,
        phrase: "in a lab",
        points: { "natural-applied-sciences": 2, "medicine-health": 1 },
      },
      {
        value: "classroom",
        label: "A classroom",
        icon: School,
        phrase: "in a classroom",
        points: { education: 3 },
      },
      { value: "court", label: "A courtroom", icon: Gavel, phrase: "in a courtroom", points: { law: 3 } },
      {
        value: "studio",
        label: "A studio",
        icon: Camera,
        phrase: "in a studio",
        points: { "arts-design-architecture": 3 },
      },
      {
        value: "site",
        label: "On site or outdoors",
        icon: HardHat,
        phrase: "on site or outdoors",
        points: { engineering: 2, "natural-applied-sciences": 1 },
      },
      {
        value: "online",
        label: "Online or from home",
        icon: Laptop,
        phrase: "working online",
        points: { "computing-technology": 2, "business-management": 1 },
      },
      {
        value: "community",
        label: "In the community",
        icon: HeartHandshake,
        phrase: "in the community",
        points: { "social-behavioural-sciences": 2, education: 1 },
      },
      { value: "unsure", label: "I’m not sure yet", icon: CircleQuestionMark, points: {} },
    ],
  },
  {
    key: "q5",
    title: "What matters most to you?",
    hint,
    verb: "you care about",
    options: [
      {
        value: "helping",
        label: "Helping others",
        icon: HandHeart,
        points: { "medicine-health": 2, "social-behavioural-sciences": 1, education: 1 },
      },
      {
        value: "creating",
        label: "Creating new things",
        icon: Sparkles,
        points: { "arts-design-architecture": 2, engineering: 1, "computing-technology": 1 },
      },
      {
        value: "fairness",
        label: "Fairness and justice",
        icon: Scale,
        points: { law: 3, "social-behavioural-sciences": 1 },
      },
      {
        value: "discovery",
        label: "Discovering how things work",
        icon: Telescope,
        phrase: "discovering how things work",
        points: { "natural-applied-sciences": 2, engineering: 1 },
      },
      {
        value: "earning",
        label: "Earning a good living",
        icon: Wallet,
        points: { "business-management": 2, "computing-technology": 1, "medicine-health": 1 },
      },
      {
        value: "sharing",
        label: "Sharing what I know",
        icon: GraduationCap,
        phrase: "sharing what you know",
        points: { education: 3 },
      },
      {
        value: "ideas",
        label: "Big ideas and stories",
        icon: Lightbulb,
        points: { "humanities-languages": 2, "social-behavioural-sciences": 1 },
      },
      {
        value: "future",
        label: "Building the future",
        icon: Rocket,
        points: { "computing-technology": 2, engineering: 2 },
      },
    ],
  },
  {
    key: "q6",
    title: "How do you like to learn?",
    hint,
    verb: "you like learning by",
    options: [
      {
        value: "hands-on",
        label: "Doing things hands-on",
        icon: Hand,
        phrase: "doing things hands-on",
        points: { engineering: 2, "medicine-health": 1, "arts-design-architecture": 1 },
      },
      {
        value: "reading",
        label: "Reading",
        icon: BookOpenText,
        phrase: "reading",
        points: { "humanities-languages": 2, law: 1 },
      },
      {
        value: "talking",
        label: "Talking it through",
        icon: MessagesSquare,
        phrase: "talking things through",
        points: { "social-behavioural-sciences": 1, education: 1, law: 1 },
      },
      {
        value: "experiments",
        label: "Experiments",
        icon: TestTube,
        phrase: "doing experiments",
        points: { "natural-applied-sciences": 2, "medicine-health": 1 },
      },
      {
        value: "computers",
        label: "Using computers",
        icon: MonitorPlay,
        phrase: "using computers",
        points: { "computing-technology": 2 },
      },
      {
        value: "visual",
        label: "Pictures and diagrams",
        icon: Image,
        phrase: "looking at pictures and diagrams",
        points: { "arts-design-architecture": 2, engineering: 1 },
      },
      {
        value: "projects",
        label: "Real-world projects",
        icon: Briefcase,
        phrase: "working on real projects",
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

const phraseOf = (o: QuizOption) => o.phrase ?? o.label.toLowerCase();

function chosenOptions(q: QuizQuestion, answers: QuizAnswers) {
  return q.options.filter((o) => answers[q.key]?.includes(o.value));
}

/** "what you enjoy (science and technology) and what you’re good at (writing)". */
export function answerSummary(answers: QuizAnswers) {
  const [enjoy, good] = questions;
  const parts = [
    { lead: "what you enjoy", options: chosenOptions(enjoy, answers) },
    { lead: "what you’re good at", options: chosenOptions(good, answers) },
  ]
    .map((p) => ({ ...p, options: p.options.filter((o) => Object.keys(o.points).length > 0) }))
    .filter((p) => p.options.length > 0)
    .map((p) => `${p.lead} (${joinWithAnd(p.options.map(phraseOf))})`);
  return parts.length > 0 ? joinWithAnd(parts) : null;
}

export type FieldMatch = { field: FieldSummary; score: number; reason: string };

/**
 * The best three fields for these answers, with a short reason for each.
 * Ties keep the order the fields are listed in. Fields that score nothing
 * are left out.
 */
export function scoreFields(answers: QuizAnswers, fields: FieldSummary[], limit = 3): FieldMatch[] {
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
      return { field, order, score, reason: reasonFrom(contributions) };
    })
    .filter((m) => m.score > 0)
    .sort((a, b) => b.score - a.score || a.order - b.order)
    .slice(0, limit)
    .map(({ field, score, reason }) => ({ field, score, reason }));
}

/** "Because you enjoy technology and you’re good at solving problems." from the two strongest answers. */
function reasonFrom(contributions: { question: number; option: QuizOption; points: number }[]) {
  const top = [...contributions]
    .sort((a, b) => b.points - a.points || a.question - b.question)
    .slice(0, 2)
    .sort((a, b) => a.question - b.question);
  const clauses: string[] = [];
  for (let i = 0; i < top.length; i++) {
    const { question, option } = top[i];
    if (i > 0 && top[i - 1].question === question) {
      clauses[clauses.length - 1] =
        `${questions[question].verb} ${joinWithAnd([phraseOf(top[i - 1].option), phraseOf(option)])}`;
    } else {
      clauses.push(`${questions[question].verb} ${phraseOf(option)}`);
    }
  }
  return `Because ${joinWithAnd(clauses)}.`;
}
