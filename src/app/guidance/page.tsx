import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight, Clock } from "lucide-react";
import { ArticleIcon } from "@/components/guidance/ArticleIcon";
import { Container } from "@/components/layout/PageShell";
import { HelpCallout } from "@/components/ui/Blocks";
import { listGuidanceArticles } from "@/lib/data/public";
import { readTime } from "@/lib/format";

export const metadata: Metadata = {
  title: "Guidance",
  description: "Simple, step-by-step help for every stage, from choosing a field to paying for university.",
};

export const revalidate = 300;

export default async function GuidancePage() {
  const articles = await listGuidanceArticles();

  return (
    <Container className="pt-6 pb-7 lg:pt-12 lg:pb-16">
      <h1 className="text-h1 lg:text-[40px] lg:leading-[46px]">Guidance</h1>
      <p className="mt-3 text-body-m text-muted lg:mt-3.5 lg:text-body-l">
        Simple, step-by-step help for every stage, from choosing a field to paying for university.
      </p>

      {articles === null ? (
        <p className="mt-5 rounded-2xl bg-tint-lavender p-5 text-body-m lg:mt-10" role="status">
          The database isn&apos;t connected yet. Add the Supabase environment variables to see guidance.
        </p>
      ) : articles.length === 0 ? (
        <p className="mt-5 rounded-2xl bg-blush p-5 text-body-m lg:mt-10">
          No guidance is published yet. Check back soon.
        </p>
      ) : null}

      {/* Cards in a row match heights (grid rows stretch); summaries are clamped to two lines, the full text is on the article page. */}
      <ul className="mt-5 grid gap-3 lg:mt-10 lg:grid-cols-2 lg:gap-x-6 lg:gap-y-4">
        {(articles ?? []).map((a, i) => (
          <li key={a.id} className="flex flex-col *:flex-1">
            <Link
              href={`/guidance/${a.slug}`}
              className="group flex items-center gap-3.5 rounded-[20px] border border-border-soft bg-card p-4 transition-shadow hover:shadow-raised"
            >
              <ArticleIcon slug={a.slug} index={i} />
              <span className="flex min-w-0 flex-1 flex-col gap-1 self-stretch">
                <span className="text-label-l">{a.title}</span>
                {a.summary && <span className="line-clamp-2 text-body-s text-muted">{a.summary}</span>}
                <span className="mt-auto flex items-center gap-1 text-caption text-muted">
                  <Clock className="size-3.5" strokeWidth={1.75} aria-hidden="true" />
                  {readTime(a.body_markdown)}
                </span>
              </span>
              <ChevronRight
                className="size-5 shrink-0 transition-transform group-hover:translate-x-0.5"
                strokeWidth={1.75}
                aria-hidden="true"
              />
            </Link>
          </li>
        ))}
        {/* Sized to its own content, not stretched to the card beside it. */}
        <li className="mt-4 lg:mt-0 lg:self-start">
          <HelpCallout />
        </li>
      </ul>
    </Container>
  );
}
