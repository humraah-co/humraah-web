/* eslint-disable @next/next/no-img-element -- small static brand SVGs */
import { Award, BookOpen, Compass, Download, Landmark, type LucideIcon } from "lucide-react";
import { LogoMark, LogoStacked } from "@/components/brand/Logo";
import { ScholarshipCard } from "@/components/content/Cards";
import { Container } from "@/components/layout/PageShell";
import { ButtonLink } from "@/components/ui/Button";
import { Chip, ChipList } from "@/components/ui/Chip";
import { DottedPath, SectionHeader } from "@/components/ui/Blocks";
import { listFields, listScholarshipCards, type ScholarshipCard as ScholarshipCardData } from "@/lib/data/public";
import { daysUntil } from "@/lib/format";

export const revalidate = 300;

const numberWords = ["no", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten"];

/** Up to three scholarships: the ones closing next, then any without a confirmed date. */
function closingSoon(all: ScholarshipCardData[]) {
  const upcoming = all
    .filter((s) => s.deadline && daysUntil(s.deadline) >= 0)
    .sort((a, b) => a.deadline!.localeCompare(b.deadline!));
  const undated = all.filter((s) => !s.deadline);
  return [...upcoming, ...undated].slice(0, 3);
}

export default async function HomePage() {
  const [fields, scholarships] = await Promise.all([listFields(), listScholarshipCards()]);
  const connected = fields !== null && scholarships !== null;
  const fieldCount = fields?.length ?? 0;
  const fieldsPhrase =
    fieldCount > 0 ? `${numberWords[fieldCount] ?? fieldCount} fields of study` : "the fields of study";
  const closing = scholarships ? closingSoon(scholarships) : [];

  const steps: {
    icon: LucideIcon;
    tint: string;
    title: string;
    text: string;
    href: string;
    link: string;
  }[] = [
    {
      icon: Compass,
      tint: "bg-tint-coral",
      title: "Discover what you enjoy",
      text: `Take a two-minute quiz or browse ${fieldsPhrase}.`,
      href: "/quiz",
      link: "Take the quiz",
    },
    {
      icon: Landmark,
      tint: "bg-tint-lavender",
      title: "Find universities",
      text: "See programmes, fees and how to apply, with the official source for every detail.",
      href: "/universities",
      link: "Find a university",
    },
    {
      icon: Award,
      tint: "bg-tint-sage",
      title: "Find support to pay",
      text: "Merit and need-based scholarships from Pakistan and abroad.",
      href: "/scholarships",
      link: "Find scholarships",
    },
    {
      icon: BookOpen,
      tint: "bg-blush",
      title: "Plan your next step",
      text: "Keep track with our free guide in English and Urdu.",
      href: "/guide",
      link: "Get the guide",
    },
  ];

  return (
    <>
      {/* Hero */}
      <Container className="pt-4 pb-2 lg:pt-16 lg:pb-14">
        <div className="flex flex-col gap-4 rounded-[32px] bg-blush px-5 py-6 lg:flex-row lg:items-center lg:gap-16 lg:rounded-none lg:bg-transparent lg:p-0">
          <div className="flex flex-col gap-4 lg:flex-1 lg:gap-5">
            <div className="flex items-center gap-3">
              <p className="flex-1 text-script text-charcoal lg:text-[30px] lg:leading-8 lg:text-deep-rose">
                For every girl who dreams, questions and hopes
              </p>
              <LogoMark className="h-[46.662px] w-[50.4px] lg:hidden" />
            </div>
            <h1 className="text-display">Your path to university starts here.</h1>
            <p className="text-body-l text-muted">
              Find out what you could study, which universities offer it, what it costs and where to start, one
              step at a time.
            </p>
            <div className="flex flex-col gap-2.5 lg:flex-row lg:gap-3 lg:pt-2">
              <ButtonLink href="/quiz" className="w-full lg:w-auto">
                Where do I start?
              </ButtonLink>
              <ButtonLink href="/universities" variant="secondary" className="w-full lg:w-auto">
                Explore universities
              </ButtonLink>
            </div>
          </div>

          <div
            aria-hidden="true"
            className="relative hidden h-[440px] w-[520px] shrink-0 items-center justify-center rounded-[40px] bg-blush lg:flex"
          >
            <LogoStacked />
            <img
              src="/brand/deco-sprig.svg"
              alt=""
              width={80}
              height={120}
              className="absolute top-[290px] left-[410px] block h-[120px] w-20"
            />
            <img
              src="/brand/deco-arcs.svg"
              alt=""
              width={100}
              height={52}
              className="absolute top-9 left-9 block h-[52px] w-[100px]"
            />
          </div>
        </div>
      </Container>

      {/* Path */}
      <Container className="flex flex-col gap-5 pt-8 pb-2 lg:gap-8 lg:py-14">
        <h2 className="text-h2 lg:text-[40px] lg:leading-[46px]">From “I don’t know” to “I’ve applied”</h2>
        <ol className="flex flex-col lg:flex-row lg:gap-6">
          {steps.map((step, i) => {
            const last = i === steps.length - 1;
            const Icon = step.icon;
            return (
              <li key={step.title} className="flex gap-3.5 lg:flex-1 lg:flex-col lg:gap-2.5">
                <div className="flex w-12 shrink-0 flex-col items-center gap-1.5 lg:w-full lg:flex-row lg:gap-3">
                  <span
                    className={`flex size-12 shrink-0 items-center justify-center rounded-pill lg:size-14 ${step.tint}`}
                  >
                    <Icon className="size-6 lg:size-[26px]" strokeWidth={1.75} aria-hidden="true" />
                  </span>
                  {!last && (
                    <>
                      <span className="flex flex-1 flex-col items-center pt-0.5 pb-1 lg:hidden">
                        <DottedPath direction="vertical" />
                      </span>
                      <span className="hidden flex-1 items-center pr-1 lg:flex">
                        <DottedPath direction="horizontal" />
                      </span>
                    </>
                  )}
                </div>
                <div className={`flex min-w-0 flex-1 flex-col gap-1 pt-0.5 lg:flex-none lg:pt-0 ${last ? "" : "pb-[22px] lg:pb-0"}`}>
                  <p className="text-label-s text-muted">Step {i + 1}</p>
                  <h3 className="text-h3">{step.title}</h3>
                  <p className="text-body-s text-muted lg:text-body-m">{step.text}</p>
                  <ButtonLink href={step.href} variant="text">
                    {step.link}
                  </ButtonLink>
                </div>
              </li>
            );
          })}
        </ol>
      </Container>

      {/* Closing soon */}
      <Container className="flex flex-col gap-3.5 pt-7 pb-2 lg:gap-6 lg:pt-6 lg:pb-14">
        <SectionHeader
          title={
            <>
              <span className="lg:hidden">Closing soon</span>
              <span className="hidden lg:inline">Scholarships closing soon</span>
            </>
          }
          href="/scholarships"
          linkLabel={
            <>
              <span className="lg:hidden">See all</span>
              <span className="hidden lg:inline">See all scholarships</span>
            </>
          }
        />
        {!connected ? (
          <p className="rounded-2xl bg-tint-lavender p-5 text-body-m" role="status">
            The database isn&apos;t connected yet. Add the Supabase environment variables to see scholarships.
          </p>
        ) : closing.length === 0 ? (
          <p className="rounded-2xl bg-blush p-5 text-body-m">
            No scholarships are published yet. Check back soon.
          </p>
        ) : (
          <ul className="grid gap-3.5 lg:grid-cols-3 lg:gap-6">
            {closing.map((s, i) => (
              <li key={s.id} className={`flex flex-col *:flex-1 ${i === 2 ? "hidden lg:flex" : ""}`}>
                <ScholarshipCard scholarship={s} />
              </li>
            ))}
          </ul>
        )}
      </Container>

      {/* Guide */}
      <Container className="pt-6 pb-2 lg:pb-14">
        <section
          aria-labelledby="guide-heading"
          className="flex flex-col gap-4 rounded-[28px] bg-tint-sage p-5 lg:flex-row lg:items-center lg:gap-10 lg:rounded-[32px] lg:p-10"
        >
          <div className="flex items-center gap-4 lg:contents">
            <div className="flex h-[124px] w-[92px] shrink-0 flex-col items-center justify-center gap-2 rounded-[10px] border border-border-soft bg-cream p-2 lg:h-[224px] lg:w-[168px] lg:gap-3 lg:rounded-[14px] lg:p-4">
              <LogoMark className="h-[37.774px] w-[40.8px] lg:h-[77.77px] lg:w-[84px]" />
              <p className="w-[76px] text-center text-label-xs lg:w-[136px] lg:text-label-s">Higher Education Guide</p>
            </div>
            <div className="flex min-w-0 flex-1 flex-col gap-1.5 lg:gap-3.5">
              <h2 id="guide-heading" className="text-h3 lg:text-[40px] lg:leading-[46px] lg:font-semibold lg:tracking-[-0.2px]">
                Our free Higher Education Guide
              </h2>
              <p className="text-body-s lg:text-body-l">
                Discover yourself, explore your options
                <span className="lg:hidden"> and find the right university.</span>
                <span className="hidden lg:inline">, find the right university and build your path, in English and Urdu.</span>
              </p>
              <ChipList className="hidden lg:flex lg:gap-2">
                {[
                  "Why higher education matters",
                  "Discover yourself",
                  "Exploring your options",
                  "Finding the right university",
                  "Build your path",
                ].map((chapter) => (
                  <Chip key={chapter}>{chapter}</Chip>
                ))}
              </ChipList>
              <div className="hidden gap-3 pt-1.5 lg:flex">
                <GuideDownloads />
              </div>
            </div>
          </div>
          <div className="flex gap-2.5 lg:hidden">
            <GuideDownloads />
          </div>
          <p className="text-caption text-muted lg:hidden">Free to download, in English and Urdu.</p>
        </section>
      </Container>

      {/* Why Humraah */}
      <Container className="flex flex-col gap-3 py-9 lg:flex-row lg:gap-16 lg:pt-14 lg:pb-[72px]">
        <div className="flex flex-col gap-3 lg:w-[520px] lg:shrink-0 lg:gap-4">
          <img
            src="/brand/deco-heart-divider.svg"
            alt=""
            width={240}
            height={16}
            className="block h-4 w-60"
          />
          <h2 className="text-h2 lg:text-[40px] lg:leading-[46px]">Humraah means “companion”.</h2>
        </div>
        <div className="flex flex-col items-start gap-3 lg:flex-1 lg:gap-4">
          <p className="text-body-m text-muted lg:text-body-l">
            Many girls in Pakistan stop after FSc, not because they don’t want to continue, but because no one
            showed them how. We’re here to walk alongside you
            <span className="hidden lg:inline">
              , with the information, resources and support to pursue higher education and build your own path
              forward
            </span>
            .
          </p>
          <ButtonLink href="/about" variant="text">
            About Humraah
          </ButtonLink>
        </div>
      </Container>
    </>
  );
}

function GuideDownloads() {
  return (
    <>
      <ButtonLink href="/guide" variant="secondary" className="flex-1 lg:flex-none">
        <Download className="size-5" strokeWidth={1.75} aria-hidden="true" />
        English PDF
      </ButtonLink>
      <ButtonLink href="/guide" variant="secondary" className="flex-1 lg:flex-none">
        <Download className="size-5" strokeWidth={1.75} aria-hidden="true" />
        Urdu PDF
      </ButtonLink>
    </>
  );
}
