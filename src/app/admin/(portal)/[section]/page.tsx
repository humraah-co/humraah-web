import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/admin/Workspace";
import { ButtonLink } from "@/components/ui/Button";
import { ADMIN_HOME } from "@/lib/admin/paths";
import { requireActiveMember } from "@/lib/admin/session";

/**
 * Holding pages for the sections still to build, so every link in the
 * sidebar and dashboard goes somewhere. A real page at the same path
 * (e.g. app/admin/(portal)/universities) takes over from this one.
 */
const sections: Record<string, { title: string; description: string }> = {
  resources: { title: "Resources", description: "Manage the links on the Resources page." },
  fields: { title: "Fields of study", description: "Edit the ten fields of study." },
  guidance: { title: "Guidance articles", description: "Write and publish guidance articles." },
};

type Props = { params: Promise<{ section: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { section } = await params;
  return { title: sections[section]?.title ?? "Not found" };
}

export default async function ComingSoon({ params }: Props) {
  await requireActiveMember();
  const { section } = await params;
  const page = sections[section];
  if (!page) notFound();
  return (
    <>
      <PageHeader title={page.title} description={page.description} />
      <div className="flex max-w-[640px] flex-col items-start gap-3 rounded-[20px] border border-border-soft bg-card p-6">
        <p className="text-label-s text-deep-rose uppercase">Coming soon</p>
        <p className="text-body-m">
          This part of the workspace is being built. The dashboard numbers already come from the live
          database.
        </p>
        <ButtonLink href={ADMIN_HOME} variant="secondary">
          Back to the dashboard
        </ButtonLink>
      </div>
    </>
  );
}
