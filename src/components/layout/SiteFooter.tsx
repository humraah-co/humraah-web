import Link from "next/link";
import { AtSign, Mail, Users } from "lucide-react";
import { LogoHorizontal } from "@/components/brand/Logo";
import { contact, footerExplore, footerHelp, type NavItem } from "@/lib/nav";

const tagline = "Walking alongside you, towards your dreams.";
const about =
  "A youth-led initiative giving girls the information, resources and support to pursue higher education and build their own paths forward.";
const disclaimer =
  "Humraah shares information to help you plan. Always confirm fees, dates and requirements on the official website before you apply.";

/** Mobile "Footer" (Figma 4:556) and "Desktop/Footer" (14:339), with the palette band. */
export function SiteFooter() {
  return (
    <footer className="bg-blush">
      {/* From 1024 to 1279 px the link columns take the width they need and the first column the rest, so the
          email address never pushes the page wider than the screen. The Figma grid applies from 1280 px. */}
      <div className="mx-auto flex max-w-[1440px] flex-col gap-[22px] px-6 pt-8 pb-7 lg:grid lg:grid-cols-[minmax(0,1fr)_auto_auto_auto] lg:gap-10 lg:px-20 lg:pt-14 lg:pb-8 xl:grid-cols-[380px_1fr_1fr_1fr] xl:gap-16">
        <div className="flex flex-col gap-[22px] lg:gap-3.5">
          <LogoHorizontal />
          <p className="text-script text-charcoal">{tagline}</p>
          <p className="hidden text-body-s text-muted lg:block">{about}</p>
        </div>

        {/* Mobile: two link columns side by side. Desktop: separate columns with headings. */}
        <div className="grid grid-cols-2 gap-6 lg:contents">
          <FooterColumn title="Explore" items={footerExplore} />
          <FooterColumn title="Help" items={footerHelp} />
        </div>

        <div className="flex flex-col gap-2.5 lg:gap-3">
          <p className="hidden text-label-s text-muted lg:block">Contact</p>
          <ContactRow icon={<AtSign className="size-[18px]" strokeWidth={1.75} />}>
            <a href={contact.instagramUrl} className="hover:text-deep-rose" rel="noopener">
              Instagram: {contact.instagramHandle}
            </a>
          </ContactRow>
          <ContactRow icon={<Users className="size-[18px]" strokeWidth={1.75} />}>
            LinkedIn: {contact.linkedinLabel}
          </ContactRow>
          <ContactRow icon={<Mail className="size-[18px]" strokeWidth={1.75} />}>
            <a href={`mailto:${contact.email}`} className="hover:text-deep-rose">
              {contact.email}
            </a>
          </ContactRow>
        </div>

        <p className="text-caption text-muted lg:hidden">{disclaimer}</p>
        <p className="text-label-xs tracking-[2.42px] text-charcoal lg:hidden">
          WALKING ALONGSIDE. GROWING TOGETHER.
        </p>
      </div>

      <div className="mx-auto hidden max-w-[1440px] items-center justify-between gap-8 px-20 pb-7 lg:flex">
        <p className="max-w-[720px] text-caption text-muted">
          {disclaimer}{" "}
          <Link href="/privacy" className="underline underline-offset-2 hover:text-deep-rose">
            Privacy and disclaimer
          </Link>
        </p>
        <p className="text-label-xs tracking-[2.42px] whitespace-nowrap text-charcoal">
          WALKING ALONGSIDE. GROWING TOGETHER.
        </p>
      </div>

      <div className="flex h-3" aria-hidden="true">
        <span className="flex-1 bg-coral" />
        <span className="flex-1 bg-sage" />
        <span className="flex-1 bg-lavender" />
        <span className="flex-1 bg-card" />
        <span className="flex-1 bg-charcoal" />
      </div>
    </footer>
  );
}

function FooterColumn({ title, items }: { title: string; items: NavItem[] }) {
  return (
    <nav aria-label={title} className="flex flex-col gap-3">
      <p className="hidden text-label-s text-muted lg:block">{title}</p>
      {items.map((item) => (
        <Link key={item.href} href={item.href} className="text-label-m text-charcoal hover:text-deep-rose">
          {item.label}
        </Link>
      ))}
    </nav>
  );
}

function ContactRow({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <p className="flex items-center gap-2.5 text-body-s text-charcoal">
      <span aria-hidden="true">{icon}</span>
      {children}
    </p>
  );
}
