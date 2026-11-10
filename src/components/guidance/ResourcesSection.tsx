import { Award, Compass, Landmark, Pencil, type LucideIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { ResourceCard } from "@/components/content/Cards";
import type { ResourceLink } from "@/lib/data/public";
import type { ResourceCategory } from "@/lib/database.types";
import { CardGrid } from "@/components/layout/CardGrid";

/** Groups in the Figma order (28:2422), each with its card icon. Titles are in "resources.groups". */
const groups: { category: ResourceCategory; icon: LucideIcon }[] = [
  { category: "official", icon: Landmark },
  { category: "scholarships", icon: Award },
  { category: "tests", icon: Pencil },
  { category: "guidance", icon: Compass },
];

/** The resources part of the Guidance page. `resources` is null when the database isn't connected. */
export function ResourcesSection({ resources }: { resources: ResourceLink[] | null }) {
  const t = useTranslations("resources");
  const byCategory = new Map<ResourceCategory, ResourceLink[]>();
  for (const r of resources ?? []) byCategory.set(r.category, [...(byCategory.get(r.category) ?? []), r]);
  const shown = groups.filter((g) => byCategory.has(g.category));

  return (
    <section id="resources" aria-labelledby="resources-heading" className="scroll-mt-24 lg:scroll-mt-28">
      <h2 id="resources-heading" className="text-h2 lg:text-[40px] lg:leading-[46px]">
        {t("title")}
      </h2>
      <p className="mt-2 text-body-m text-muted lg:mt-3 lg:max-w-[720px] lg:text-body-l">{t("intro")}</p>

      <div className="mt-5 flex flex-col gap-6 lg:mt-6 lg:gap-8">
        {resources === null ? (
          <p className="rounded-2xl bg-tint-lavender p-5 text-body-m" role="status">
            {t("notConnected")}
          </p>
        ) : shown.length === 0 ? (
          <p className="rounded-2xl bg-blush p-5 text-body-m">{t("noResources")}</p>
        ) : (
          shown.map((g) => (
            <div key={g.category} className="flex flex-col gap-2.5 lg:gap-3">
              <h3 className="text-label-l">{t(`groups.${g.category}`)}</h3>
              <CardGrid
                items={byCategory.get(g.category)!.map((r) => ({
                  key: r.id,
                  node: (
                    <ResourceCard
                      title={r.title}
                      description={r.description}
                      href={r.url}
                      icon={g.icon}
                      english={r.english}
                    />
                  ),
                }))}
              />
            </div>
          ))
        )}
      </div>
    </section>
  );
}
