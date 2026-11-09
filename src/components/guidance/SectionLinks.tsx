import { useTranslations } from "next-intl";

const sections = ["guide", "articles", "resources"] as const;

/**
 * Anchor links to the parts of the Guidance page (#guide, #articles,
 * #resources). Plain links, so they work without JavaScript and each part
 * can be shared by its address.
 */
export function SectionLinks() {
  const t = useTranslations("guidance");
  return (
    <nav aria-label={t("jumpTo")} className="mt-5 lg:mt-7">
      <ul className="flex flex-wrap gap-2">
        {sections.map((id) => (
          <li key={id}>
            <a
              href={`#${id}`}
              className="inline-flex min-h-11 items-center rounded-pill border border-border-strong bg-card px-4 text-label-m whitespace-nowrap text-charcoal transition-colors hover:bg-blush"
            >
              {t(`jump.${id}`)}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
