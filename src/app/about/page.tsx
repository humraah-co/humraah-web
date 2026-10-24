import type { Metadata } from "next";
import { AtSign, BookOpen, Compass, Mail, Sprout, Users, type LucideIcon } from "lucide-react";
import { ContactForm } from "@/components/about/ContactForm";
import { LogoStacked } from "@/components/brand/Logo";
import { Container } from "@/components/layout/PageShell";
import { HelpCallout } from "@/components/ui/Blocks";
import { contact } from "@/lib/nav";

export const metadata: Metadata = {
  title: "About and contact",
  description:
    "Humraah is a youth-led initiative giving girls in Pakistan the information, resources and support to pursue higher education.",
};

const story = [
  {
    title: "The name",
    text: "Humraah means companion: someone who walks the journey with you.",
    tint: "bg-tint-lavender",
  },
  {
    title: "The problem",
    text: "In Pakistan, many girls who get an education stop at FSc, even when they want to continue. Not always because they don’t want to. Often because no one showed them how.",
    tint: "bg-blush",
  },
  {
    title: "What we do",
    text: "We give girls the information, resources, guidance and support to explore their own path, no one else’s.",
    tint: "bg-tint-sage",
  },
];

const values: { title: string; text: string; icon: LucideIcon; tint: string }[] = [
  {
    title: "Empower with knowledge",
    text: "Clear, official information you can trust.",
    icon: BookOpen,
    tint: "bg-tint-coral",
  },
  {
    title: "Make opportunities accessible",
    text: "Free resources in English and Urdu.",
    icon: Compass,
    tint: "bg-tint-sage",
  },
  {
    title: "Build a supportive community",
    text: "Girls helping girls find their way.",
    icon: Users,
    tint: "bg-tint-lavender",
  },
  { title: "Encourage confidence", text: "Your path, your choices.", icon: Sprout, tint: "bg-blush" },
];

const about =
  "A youth-led initiative giving girls the information, resources and support to pursue higher education and build their own paths forward.";

export default function AboutPage() {
  return (
    <>
      {/* Hero: a centred blush panel on phones (30:2442), text beside the logo panel on desktop (33:3140). */}
      <Container className="px-4 pt-4 pb-2 lg:px-20 lg:pt-14 lg:pb-0">
        <div className="flex flex-col items-center gap-3.5 rounded-[32px] bg-blush px-5 pt-8 pb-7 text-center lg:grid lg:grid-cols-[minmax(0,1fr)_442px] lg:items-center lg:gap-16 lg:rounded-none lg:bg-transparent lg:p-0 lg:text-left">
          <div className="order-2 flex flex-col gap-3.5 lg:order-1 lg:gap-4">
            <p className="text-script text-charcoal lg:text-[28px] lg:leading-[32px] lg:text-deep-rose">
              Har Raah Mein Humraah.
            </p>
            <h1 className="sr-only lg:not-sr-only lg:font-serif lg:text-[56px] lg:leading-[60px] lg:font-semibold lg:tracking-[-0.8px]">
              Humraah means “companion”.
            </h1>
            <p className="text-body-m text-muted lg:max-w-[600px] lg:text-body-l">{about}</p>
          </div>
          <div className="order-1 lg:order-2 lg:flex lg:h-[341px] lg:items-center lg:justify-center lg:rounded-[40px] lg:bg-blush">
            <LogoStacked size="about" />
          </div>
        </div>
      </Container>

      <Container className="flex flex-col gap-3 pt-6 pb-2 lg:grid lg:grid-cols-3 lg:gap-6 lg:pt-14">
        {story.map((s) => (
          <section key={s.title} className={`flex flex-col gap-2 rounded-3xl p-5 lg:p-6 ${s.tint}`}>
            <h2 className="text-h3">{s.title}</h2>
            <p className="text-body-m">{s.text}</p>
          </section>
        ))}
      </Container>

      <Container className="flex flex-col gap-1.5 pt-5 pb-2 lg:hidden">
        <p className="text-label-s text-muted">Our promise</p>
        <p className="font-script text-[30px] leading-[32px] text-deep-rose">
          Walking alongside you, towards your dreams.
        </p>
      </Container>

      <Container className="pt-5 pb-2 lg:pt-14">
        <h2 className="text-h2 lg:text-[40px] lg:leading-[46px]">What we believe in</h2>
        <ul className="mt-3.5 grid grid-cols-2 gap-4 lg:mt-6 lg:grid-cols-4 lg:gap-6">
          {values.map(({ title, text, icon: Icon, tint }) => (
            <li key={title} className={`flex flex-col gap-2.5 rounded-[22px] p-4 lg:p-5 ${tint}`}>
              <span className="flex size-11 items-center justify-center rounded-pill bg-card">
                <Icon className="size-[22px]" strokeWidth={1.75} aria-hidden="true" />
              </span>
              <span className="text-label-l">{title}</span>
              <span className="text-body-s">{text}</span>
            </li>
          ))}
        </ul>
      </Container>

      <Container className="flex flex-col gap-3.5 pt-7 pb-7 lg:grid lg:grid-cols-[minmax(0,1fr)_520px] lg:items-start lg:gap-x-16 lg:pt-16 lg:pb-16">
        <section aria-labelledby="contact-heading" className="flex flex-col gap-3.5 lg:gap-5">
          <h2 id="contact-heading" className="text-h2 lg:text-[40px] lg:leading-[46px]">
            Get in touch
          </h2>
          <HelpCallout />
          <ul className="flex flex-col gap-2.5 text-body-m">
            <li className="flex items-center gap-2.5">
              <AtSign className="size-5 shrink-0" strokeWidth={1.75} aria-hidden="true" />
              <a href={contact.instagramUrl} rel="noopener" className="hover:text-deep-rose">
                Instagram: {contact.instagramHandle}
              </a>
            </li>
            <li className="flex items-center gap-2.5">
              <Users className="size-5 shrink-0" strokeWidth={1.75} aria-hidden="true" />
              LinkedIn: {contact.linkedinLabel}
            </li>
            <li className="flex items-center gap-2.5">
              <Mail className="size-5 shrink-0" strokeWidth={1.75} aria-hidden="true" />
              <a href={`mailto:${contact.email}`} className="hover:text-deep-rose">
                {contact.email}
              </a>
            </li>
          </ul>
        </section>

        <div className="rounded-3xl border border-border-soft bg-card p-5 lg:p-6">
          <ContactForm />
        </div>
      </Container>
    </>
  );
}
