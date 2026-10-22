import {
  BookOpenText,
  Briefcase,
  FlaskConical,
  GraduationCap,
  Lightbulb,
  Monitor,
  Palette,
  Scale,
  Settings,
  Stethoscope,
  Users,
  type LucideIcon,
} from "lucide-react";

/**
 * Icon and IconWrap fill for each field of study, as set in Figma's
 * Card/Field instances. A field added later in the admin portal falls back to
 * the lightbulb on blush.
 */
const fieldStyles: Record<string, { icon: LucideIcon; tint: string }> = {
  "business-management": { icon: Briefcase, tint: "bg-tint-coral" },
  engineering: { icon: Settings, tint: "bg-tint-lavender" },
  "computing-technology": { icon: Monitor, tint: "bg-tint-sage" },
  "medicine-health": { icon: Stethoscope, tint: "bg-tint-coral" },
  "social-behavioural-sciences": { icon: Users, tint: "bg-tint-lavender" },
  "humanities-languages": { icon: BookOpenText, tint: "bg-tint-sage" },
  "arts-design-architecture": { icon: Palette, tint: "bg-tint-coral" },
  "natural-applied-sciences": { icon: FlaskConical, tint: "bg-tint-lavender" },
  law: { icon: Scale, tint: "bg-tint-sage" },
  education: { icon: GraduationCap, tint: "bg-blush" },
};

const fallback = { icon: Lightbulb, tint: "bg-blush" };

export function fieldStyle(slug: string) {
  return fieldStyles[slug] ?? fallback;
}

const sizes = {
  md: { wrap: "size-12 rounded-2xl", icon: "size-6" },
  lg: { wrap: "size-16 rounded-[20px] lg:size-[72px] lg:rounded-[22px]", icon: "size-8 lg:size-9" },
};

export function FieldIcon({ slug, size = "md" }: { slug: string; size?: keyof typeof sizes }) {
  const { icon: Icon, tint } = fieldStyle(slug);
  return (
    <span className={`flex shrink-0 items-center justify-center ${tint} ${sizes[size].wrap}`}>
      <Icon className={sizes[size].icon} strokeWidth={1.75} aria-hidden="true" />
    </span>
  );
}
