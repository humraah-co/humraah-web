import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight, Clock, Globe } from "lucide-react";
import { ResourceCard } from "@/components/content/Cards";
import { Markdown } from "@/components/content/Markdown";
import { Container } from "@/components/layout/PageShell";
import { HelpCallout, ImportantCallout, NextSteps, StaleNotice } from "@/components/ui/Blocks";
import { getGuidanceArticle, listGuidanceArticles } from "@/lib/data/public";
import { hostOf, readTime } from "@/lib/format";

type Props = { params: Promise<{ slug: string }> };

export const revalidate = 300;

export async function generateStaticParams() {
  return ((await listGuidanceArticles()) ?? []).map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const article = await getGuidanceArticle(slug);
  if (!article) return { title: "Guidance" };
  return { title: article.title, description: article.summary ?? undefined };
}

export default async function GuidanceArticlePage({ params }: Props) {
  const { slug } = await params;
  const article = await getGuidanceArticle(slug);
  if (article === null) {
    return (
      <Container className="py-12">
        <p className="rounded-2xl bg-tint-lavender p-5 text-body-m" role="status">
          The database isn&apos;t connected yet. Add the Supabase environment variables to see this article.
        </p>
      </Container>
    );
  }
  if (!article) notFound();
  const a = article;

  return (
    <Container className="pt-5 pb-7 lg:pt-4 lg:pb-16">
      <nav aria-label="Breadcrumb" className="hidden items-center gap-1.5 text-body-s lg:flex">
        <Link
          href="/guidance"
          className="py-2.5 text-label-m text-deep-rose underline underline-offset-2 hover:text-charcoal"
        >
          Guidance
        </Link>
        <ChevronRight className="size-4" strokeWidth={1.75} aria-hidden="true" />
        <span aria-current="page" className="text-muted">
          {a.title}
        </span>
      </nav>

      <div className="flex flex-col gap-7 lg:grid lg:grid-cols-[minmax(0,1fr)_370px] lg:items-start lg:gap-x-16 lg:pt-6">
        <article className="flex min-w-0 flex-col gap-6 lg:max-w-[740px]">
          <header className="flex flex-col gap-2.5 lg:gap-3">
            <h1 className="text-h1 lg:text-[40px] lg:leading-[46px]">{a.title}</h1>
            <p className="flex items-center gap-1 text-caption text-muted">
              <Clock className="size-3.5" strokeWidth={1.75} aria-hidden="true" />
              {readTime(a.body_markdown)}
            </p>
            {a.summary && <p className="text-body-l">{a.summary}</p>}
            <StaleNotice verifiedAt={a.last_verified_at} />
          </header>

          {a.body_markdown.trim() ? (
            <Markdown source={a.body_markdown} />
          ) : (
            <p className="rounded-2xl bg-blush p-5 text-body-m">
              This article is to be confirmed. Check back soon.
            </p>
          )}

          <div className="flex flex-col gap-3">
            <ImportantCallout title="Use official sources">
              Don’t rely only on TikTok, Instagram, WhatsApp messages or random websites. Use the university’s
              official website for the final answer.
            </ImportantCallout>
            {a.source_url && (
              <ResourceCard
                title="Source we checked"
                description={`The official page this guidance was checked against.`}
                href={a.source_url}
                source={hostOf(a.source_url)}
                icon={Globe}
              />
            )}
          </div>
        </article>

        <aside className="flex flex-col gap-4 lg:sticky lg:top-28">
          <NextSteps
            items={[
              "Pick one subject you’re curious about",
              "Find two universities that offer it",
              "Check their official admission pages",
            ]}
            action={{ href: "/universities", label: "Find a university" }}
          />
          <HelpCallout className="hidden lg:block" />
        </aside>
      </div>
    </Container>
  );
}
