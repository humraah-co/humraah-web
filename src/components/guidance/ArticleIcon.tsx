import { Award, BookOpenText, Compass, FileText, Pencil, Search, type LucideIcon } from "lucide-react";

/**
 * Icon and tint for each guidance article, as in the Figma Guidance list.
 * Articles added later in the admin portal get a book on a rotating tint.
 */
const articleStyles: Record<string, { icon: LucideIcon; tint: string }> = {
  "choosing-a-field": { icon: Compass, tint: "bg-tint-sage" },
  "how-to-research-a-university": { icon: Search, tint: "bg-tint-lavender" },
  "understanding-admissions": { icon: FileText, tint: "bg-tint-coral" },
  "paying-for-university": { icon: Award, tint: "bg-blush" },
  "admission-tests-explained": { icon: Pencil, tint: "bg-tint-sage" },
};

const fallbackTints = ["bg-tint-sage", "bg-tint-lavender", "bg-tint-coral", "bg-blush"];

export function ArticleIcon({ slug, index }: { slug: string; index: number }) {
  const { icon: Icon, tint } = articleStyles[slug] ?? {
    icon: BookOpenText,
    tint: fallbackTints[index % fallbackTints.length],
  };
  return (
    <span className={`flex size-11 shrink-0 items-center justify-center rounded-pill ${tint}`}>
      <Icon className="size-[22px]" strokeWidth={1.75} aria-hidden="true" />
    </span>
  );
}
