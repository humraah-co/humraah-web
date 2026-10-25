import type { Metadata } from "next";
import { Award, BookOpen, Compass, Landmark, Pencil, type LucideIcon } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { ResourceCard } from "@/components/content/Cards";
import { Container } from "@/components/layout/PageShell";
import { listResources, type ResourceLink } from "@/lib/data/public";
import type { ResourceCategory } from "@/lib/database.types";
import { alternates } from "@/i18n/metadata";
import { pageLocale, type LocaleParams } from "@/i18n/server";

export async function generateMetadata({ params }: { params: LocaleParams }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "resources" });
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    alternates: alternates("/resources", locale),
  };
}

export const revalidate = 300;

/** Groups in the Figma order (28:2422), each with its card icon. Titles are in "resources.groups". */
const groups: { category: ResourceCategory; icon: LucideIcon }[] = [
  { category: "official", icon: Landmark },
  { category: "scholarships", icon: Award },
  { category: "tests", icon: Pencil },
  { category: "guidance", icon: Compass },
];

export default async function ResourcesPage({ params }: { params: LocaleParams }) {
  await pageLocale(params);
  const t = await getTranslations("resources");
  const resources = await listResources();
  const byCategory = new Map<ResourceCategory, ResourceLink[]>();
  for (const r of resources ?? []) byCategory.set(r.category, [...(byCategory.get(r.category) ?? []), r]);
  const shown = groups.filter((g) => byCategory.has(g.category));

  return (
    <Container className="pt-6 pb-7 lg:pt-12 lg:pb-16">
      <h1 className="text-h1 lg:text-[40px] lg:leading-[46px]">{t("title")}</h1>
      <p className="mt-3 text-body-m text-muted lg:mt-3.5 lg:text-body-l">{t("intro")}</p>

      <div className="mt-4 flex flex-col gap-4 lg:mt-8 lg:gap-8">
        {resources === null ? (
          <p className="rounded-2xl bg-tint-lavender p-5 text-body-m" role="status">
            {t("notConnected")}
          </p>
        ) : shown.length === 0 ? (
          <p className="rounded-2xl bg-blush p-5 text-body-m">{t("noResources")}</p>
        ) : (
          shown.map((g) => (
            <Group key={g.category} title={t(`groups.${g.category}`)}>
              {byCategory.get(g.category)!.map((r) => (
                <li key={r.id} className="flex flex-col *:flex-1">
                  <ResourceCard title={r.title} description={r.description} href={r.url} icon={g.icon} />
                </li>
              ))}
            </Group>
          ))
        )}

        <Group title={t("fromHumraah")}>
          <li className="flex flex-col *:flex-1">
            <ResourceCard
              title={t("guideTitle")}
              description={t("guideText")}
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
