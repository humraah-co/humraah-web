import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ComingSoon } from "@/components/layout/PageShell";
import { listScholarshipCards } from "@/lib/data/public";

type Props = { params: Promise<{ slug: string }> };

export const revalidate = 300;

export async function generateStaticParams() {
  return ((await listScholarshipCards()) ?? []).map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const scholarship = (await listScholarshipCards())?.find((s) => s.slug === slug);
  return { title: scholarship?.name ?? "Scholarship" };
}

// Placeholder so every scholarship card links somewhere. The full page arrives on Day 3.
export default async function ScholarshipPage({ params }: Props) {
  const { slug } = await params;
  const scholarships = await listScholarshipCards();
  const scholarship = scholarships?.find((s) => s.slug === slug);
  if (scholarships && !scholarship) notFound();
  return <ComingSoon title={scholarship?.name ?? "Scholarship"} day="on Day 3" />;
}
