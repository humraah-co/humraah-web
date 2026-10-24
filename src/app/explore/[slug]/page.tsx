import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { ScholarshipCard, UniversityCard } from "@/components/content/Cards";
import { FieldIcon } from "@/components/content/FieldIcon";
import { Container } from "@/components/layout/PageShell";
import { NextSteps, RememberCallout, SectionHeader, StaleNotice } from "@/components/ui/Blocks";
import { Chip, ChipList } from "@/components/ui/Chip";
import { getField, listFields, listScholarshipCards, listUniversityCards } from "@/lib/data/public";

type Props = { params: Promise<{ slug: string }> };

export const revalidate = 300;

export async function generateStaticParams() {
  const fields = await listFields();
  return fields?.map((f) => ({ slug: f.slug })) ?? [];
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const field = await getField(slug);
  if (!field) return { title: "Field of study" };
  return { title: field.name, description: field.summary ?? undefined };
}

export default async function FieldPage({ params }: Props) {
  const { slug } = await params;
  const field = await getField(slug);
  if (field === null) {
    return (
      <Container className="py-12">
        <p className="rounded-2xl bg-tint-lavender p-5 text-body-m" role="status">
          The database isn&apos;t connected yet. Add the Supabase environment variables to see this field.
        </p>
      </Container>
    );
  }
  if (!field) notFound();

  const [universities, scholarships] = await Promise.all([listUniversityCards(), listScholarshipCards()]);

  const offering = (universities ?? []).filter((u) => u.fieldIds.includes(field.id));
  // Scholarships tied to this field first, then ones open to any field.
  const relevant = [
    ...(scholarships ?? []).filter((s) => s.fieldIds.includes(field.id)),
    ...(scholarships ?? []).filter((s) => s.fieldIds.length === 0),
  ];

  const universitiesHref = `/universities?field=${field.slug}`;

  return (
    <Container className="pt-5 pb-7 lg:pt-4 lg:pb-16">
      <nav aria-label="Breadcrumb" className="hidden items-center gap-1.5 text-body-s lg:flex">
        <Link
          href="/explore"
          className="py-2.5 text-label-m text-deep-rose underline underline-offset-2 hover:text-charcoal"
        >
          Explore fields
        </Link>
        <ChevronRight className="size-4" strokeWidth={1.75} aria-hidden="true" />
        <span aria-current="page" className="text-muted">
          {field.name}
        </span>
      </nav>

      <div className="flex flex-col lg:grid lg:grid-cols-[minmax(0,1fr)_380px] lg:gap-x-12 lg:gap-y-0 lg:pt-1">
        <header className="flex flex-col gap-3 lg:col-start-1 lg:row-start-1 lg:gap-4 lg:pb-10">
          <FieldIcon slug={field.slug} size="lg" />
          <h1 className="text-h1 lg:text-[60px] lg:leading-[64px] lg:tracking-[-0.9px]">{field.name}</h1>
          <p className="text-body-m text-muted lg:max-w-[680px] lg:text-body-l">
            {field.summary ?? "A description of this field is to be confirmed."}
          </p>
          <StaleNotice verifiedAt={field.last_verified_at} className="lg:max-w-[680px]" />

          <div className="mt-2 flex flex-col gap-2.5 lg:mt-0">
            <h2 className="text-label-l">You might enjoy this if you like</h2>
            {field.interests.length > 0 ? (
              <ChipList className="gap-2">
                {field.interests.map((interest) => (
                  <Chip key={interest} tone="sage">
                    {interest}
                  </Chip>
                ))}
              </ChipList>
            ) : (
              <p className="text-body-s text-muted">To be confirmed.</p>
            )}
          </div>

          <div className="flex flex-col gap-2.5">
            <h2 className="text-label-l">Programmes you could explore</h2>
            {field.example_programmes.length > 0 ? (
              <ChipList className="gap-2">
                {field.example_programmes.map((programme) => (
                  <Chip key={programme}>{programme}</Chip>
                ))}
              </ChipList>
            ) : (
              <p className="text-body-s text-muted">To be confirmed.</p>
            )}
          </div>
        </header>

        <div className="contents lg:col-start-2 lg:row-start-1 lg:flex lg:flex-col lg:gap-4">
          <RememberCallout className="order-1 mt-5 lg:order-2 lg:mt-0">
            Universities may name programmes differently. Check the programme page on the official website.
          </RememberCallout>
          <NextSteps
            className="order-4 mt-7 lg:order-1 lg:mt-0"
            items={[
              "Pick two universities to compare",
              "Check admission requirements",
              "Look for a scholarship",
            ]}
            action={{ href: universitiesHref, label: "Find universities" }}
          />
        </div>

        <section
          aria-labelledby="universities-heading"
          className="order-2 mt-7 flex flex-col gap-3 lg:col-span-2 lg:mt-0 lg:gap-4"
        >
          <SectionHeader
            title={<span id="universities-heading">Universities offering this</span>}
            href={universitiesHref}
            linkLabel={
              <>
                <span className="lg:hidden">See all</span>
                <span className="hidden lg:inline">See all universities</span>
              </>
            }
          />
          {universities === null ? (
            <p className="rounded-2xl bg-tint-lavender p-5 text-body-m" role="status">
              The database isn&apos;t connected yet, so universities can&apos;t be shown.
            </p>
          ) : offering.length === 0 ? (
            <p className="rounded-2xl bg-blush p-5 text-body-m">
              We haven&apos;t listed universities for this field yet. Universities to be confirmed.{" "}
              <Link
                href="/universities"
                className="text-deep-rose underline underline-offset-2 hover:text-charcoal"
              >
                Browse all universities
              </Link>
            </p>
          ) : (
            <ul className="grid gap-3.5 lg:grid-cols-3 lg:gap-6">
              {offering.slice(0, 3).map((u, i) => (
                <li key={u.id} className={`flex-col *:flex-1 ${i === 2 ? "hidden lg:flex" : "flex"}`}>
                  <UniversityCard university={u} fieldId={field.id} />
                </li>
              ))}
            </ul>
          )}
        </section>

        <section
          aria-labelledby="scholarships-heading"
          className="order-3 mt-7 flex flex-col gap-3 lg:col-span-2 lg:mt-12 lg:gap-4"
        >
          <SectionHeader
            title={<span id="scholarships-heading">Scholarships to look at</span>}
            href="/scholarships"
            linkLabel={
              <>
                <span className="lg:hidden">See all</span>
                <span className="hidden lg:inline">See all scholarships</span>
              </>
            }
          />
          {scholarships === null ? (
            <p className="rounded-2xl bg-tint-lavender p-5 text-body-m" role="status">
              The database isn&apos;t connected yet, so scholarships can&apos;t be shown.
            </p>
          ) : relevant.length === 0 ? (
            <p className="rounded-2xl bg-blush p-5 text-body-m">
              No scholarships are listed for this field yet. Scholarships to be confirmed.{" "}
              <Link
                href="/scholarships"
                className="text-deep-rose underline underline-offset-2 hover:text-charcoal"
              >
                Browse all scholarships
              </Link>
            </p>
          ) : (
            <ul className="grid gap-3.5 lg:grid-cols-3 lg:gap-6">
              {relevant.slice(0, 3).map((s, i) => (
                <li key={s.id} className={`flex-col *:flex-1 ${i === 2 ? "hidden lg:flex" : "flex"}`}>
                  <ScholarshipCard scholarship={s} />
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </Container>
  );
}
