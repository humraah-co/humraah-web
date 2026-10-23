import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/admin/Workspace";
import { ButtonLink } from "@/components/ui/Button";
import { ADMIN_HOME } from "@/lib/admin/paths";
import { requireActiveMember } from "@/lib/admin/session";

/**
 * Holding pages for the content editors, built on Day 5, so every link in
 * the sidebar and dashboard goes somewhere. A real page at the same path
 * (e.g. app/admin/(portal)/universities) takes over from this one.
 */
const sections: Record<string, { title: string; description: string }> = {
  resources: { title: "Resources", description: "Manage the links on the Resources page." },
  fields: { title: "Fields of study", description: "Edit the ten fields of study." },
  guidance: { title: "Guidance articles", description: "Write and publish guidance articles." },
  review: {
    title: "Needs review",
    description: "Every entry that is unverified, out of date or missing a source.",
  },
};

type Props = { params: Promise<{ section: string }>; searchParams: Promise<{ q?: string | string[] }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { section } = await params;
  return { title: sections[section]?.title ?? "Not found" };
}

export default async function ComingOnDay5({ params, searchParams }: Props) {
  await requireActiveMember();
  const [{ section }, { q }] = await Promise.all([params, searchParams]);
  const page = sections[section];
  if (!page) notFound();
  const query = section === "search" && typeof q === "string" ? q.trim() : "";
  return (
    <>
      <PageHeader title={page.title} description={page.description} />
      <div className="flex max-w-[640px] flex-col items-start gap-3 rounded-[20px] border border-border-soft bg-card p-6">
        <p className="text-label-s text-deep-rose uppercase">Coming on Day 5</p>
        <p className="text-body-m">
          {query ? (
            <>
              Search isn’t ready yet, so we can’t look for “<span className="font-semibold">{query}</span>”
              here.
            </>
          ) : (
            "This part of the workspace is being built."
          )}{" "}
          The dashboard numbers already come from the live database.
        </p>
        <ButtonLink href={ADMIN_HOME} variant="secondary">
          Back to the dashboard
        </ButtonLink>
      </div>
    </>
  );
}
