import type { Metadata } from "next";
import { Award, BookOpen, Compass, Landmark, Pencil, type LucideIcon } from "lucide-react";
import { ResourceCard } from "@/components/content/Cards";
import { Container } from "@/components/layout/PageShell";
import { listResources, type ResourceLink } from "@/lib/data/public";
import type { ResourceCategory } from "@/lib/database.types";

export const metadata: Metadata = {
  title: "Resources",
  description:
    "Official websites and tools we trust for university, scholarships and admission tests in Pakistan.",
};

export const revalidate = 300;

/** Groups in the Figma order (28:2422), each with its card icon. */
const groups: { category: ResourceCategory; title: string; icon: LucideIcon }[] = [
  { category: "official", title: "HEC and official resources", icon: Landmark },
  { category: "scholarships", title: "Scholarships", icon: Award },
  { category: "tests", title: "Admission tests", icon: Pencil },
  { category: "guidance", title: "Career exploration", icon: Compass },
];

export default async function ResourcesPage() {
  const resources = await listResources();
  const byCategory = new Map<ResourceCategory, ResourceLink[]>();
  for (const r of resources ?? []) byCategory.set(r.category, [...(byCategory.get(r.category) ?? []), r]);
  const shown = groups.filter((g) => byCategory.has(g.category));

  return (
    <Container className="pt-6 pb-7 lg:pt-12 lg:pb-16">
      <h1 className="text-h1 lg:text-[40px] lg:leading-[46px]">Useful resources</h1>
      <p className="mt-3 text-body-m text-muted lg:mt-3.5 lg:text-body-l">
        Official websites and tools we trust. Each link opens the official source.
      </p>

      <div className="mt-4 flex flex-col gap-4 lg:mt-8 lg:gap-8">
        {resources === null ? (
          <p className="rounded-2xl bg-tint-lavender p-5 text-body-m" role="status">
            The database isn&apos;t connected yet. Add the Supabase environment variables to see resources.
          </p>
        ) : shown.length === 0 ? (
          <p className="rounded-2xl bg-blush p-5 text-body-m">
            No resources are published yet. The research team is adding official links. Check back soon.
          </p>
        ) : (
          shown.map((g) => (
            <Group key={g.category} title={g.title}>
              {byCategory.get(g.category)!.map((r) => (
                <li key={r.id} className="flex flex-col *:flex-1">
                  <ResourceCard title={r.title} description={r.description} href={r.url} icon={g.icon} />
                </li>
              ))}
            </Group>
          ))
        )}

        <Group title="From Humraah">
          <li className="flex flex-col *:flex-1">
            <ResourceCard
              title="Higher Education Guide"
              description="Our free guide in English and Urdu."
              href="/guide"
              icon={BookOpen}
            />
          </li>
        </Group>
      </div>
    </Container>
  );
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-2.5 lg:gap-3">
      <h2 className="text-label-l">{title}</h2>
      <ul className="grid gap-2.5 lg:grid-cols-2 lg:gap-x-6 lg:gap-y-4">{children}</ul>
    </section>
  );
}
