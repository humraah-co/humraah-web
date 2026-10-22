import type { Metadata } from "next";
import { Container } from "@/components/layout/PageShell";
import { contactPrivacy } from "@/content/contactPrivacy";
import { contact } from "@/lib/nav";

export const metadata: Metadata = {
  title: "Privacy and disclaimer",
  description:
    "How Humraah's information should be used, and what happens to messages sent through the contact form.",
};

/*
 * PRIVACY WORDING: AWAITING APPROVAL.
 * The disclaimer is a short standard one written for the site. The Contact
 * Form Privacy Notice is the content pack's draft wording (see
 * src/content/contactPrivacy.ts for its status and what the site does
 * today). Neither has been approved by Humraah yet; update both before
 * launch.
 */
export default function PrivacyPage() {
  const link = "text-deep-rose underline underline-offset-2 hover:text-charcoal";
  return (
    <Container className="pt-6 pb-10 lg:pt-12 lg:pb-16">
      <div className="flex max-w-[720px] flex-col gap-8">
        <header className="flex flex-col gap-3">
          <h1 className="text-h1 lg:text-[40px] lg:leading-[46px]">Privacy and disclaimer</h1>
        </header>

        <section aria-labelledby="disclaimer" className="flex flex-col gap-3">
          <h2 id="disclaimer" className="text-h2">
            Disclaimer
          </h2>
          <p className="text-body-m">
            Humraah shares information to help you plan your higher education. We take care to check it
            against official sources, but fees, dates, eligibility and requirements change, and some entries
            have not been verified yet. Always confirm the details on the official website of the university,
            scholarship provider or Higher Education Commission (HEC) before you apply or pay anything.
          </p>
          <p className="text-body-m">
            Humraah is an independent, youth-led initiative. We are not part of HEC, any university or any
            scholarship provider, and a listing on this site is not a ranking, a recommendation or a guarantee
            of admission or funding. Links to other websites are provided for convenience; we are not
            responsible for their content.
          </p>
          <p className="text-body-m">
            Spotted something wrong or out of date? Email us at{" "}
            <a href={`mailto:${contact.email}`} className={link}>
              {contact.email}
            </a>
            .
          </p>
        </section>

        <section
          id="contact-form"
          aria-labelledby="contact-form-heading"
          className="flex scroll-mt-28 flex-col gap-3"
        >
          <h2 id="contact-form-heading" className="text-h2">
            Contact Form Privacy Notice
          </h2>
          <h3 className="text-h3">{contactPrivacy.title}</h3>
          {contactPrivacy.paragraphs.map((p) => (
            <p key={p.slice(0, 24)} className="text-body-m">
              {p}
            </p>
          ))}
        </section>
      </div>
    </Container>
  );
}
