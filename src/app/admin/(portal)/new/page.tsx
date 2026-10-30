import type { Metadata } from "next";
import Link from "next/link";
import { Award, ChevronRight, Compass, Globe, Landmark, Lightbulb } from "lucide-react";
import { PageHeader } from "@/components/admin/Workspace";
import { requireActiveMember } from "@/lib/admin/session";

export const metadata: Metadata = { title: "Add an entry" };

const choices = [
  {
    href: "/admin/universities/new",
    label: "University",
    text: "A university profile with its programmes.",
    icon: Landmark,
    tone: "bg-tint-lavender",
  },
  {
    href: "/admin/scholarships/new",
    label: "Scholarship",
    text: "A scholarship with its eligibility and deadline.",
    icon: Award,
    tone: "bg-tint-sage",
  },
  {
    href: "/admin/fields/new",
    label: "Field of study",
    text: "An area of study on Explore, with its interests and programmes.",
    icon: Compass,
    tone: "bg-tint-coral",
  },
  {
    href: "/admin/resources/new",
    label: "Resource",
    text: "An official link for the Resources page.",
    icon: Globe,
    tone: "bg-blush",
  },
  {
    href: "/admin/guidance/new",
    label: "Guidance article",
    text: "A step-by-step article in plain language.",
    icon: Lightbulb,
    tone: "bg-tint-lavender",
  },
];

/** Where the dashboard's "Add an entry" leads when its menu can't open (no JavaScript, or a bookmark). */
export default async function AddEntryPage() {
  await requireActiveMember();
  return (
    <>
      <PageHeader title="Add an entry" description="What would you like to add?" />
      <ul className="grid max-w-[720px] gap-4 sm:grid-cols-2">
        {choices.map(({ href, label, text, icon: Icon, tone }) => (
          <li key={href}>
            <Link
              href={href}
              className="flex h-full items-center gap-4 rounded-[20px] border border-border-soft bg-card p-5 hover:bg-cream"
            >
              <span className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${tone}`}>
                <Icon className="size-5" strokeWidth={1.75} aria-hidden="true" />
              </span>
              <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className="text-label-m">{label}</span>
                <span className="text-body-s text-muted">{text}</span>
              </span>
              <ChevronRight className="size-5 shrink-0" strokeWidth={1.75} aria-hidden="true" />
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}
