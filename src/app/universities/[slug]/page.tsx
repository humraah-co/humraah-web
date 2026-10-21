import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  Award,
  Calendar,
  ChevronRight,
  CircleAlert,
  FileText,
  Globe,
  GraduationCap,
  ListChecks,
  MapPin,
  Pencil,
  ShieldCheck,
  ExternalLink,
  type LucideIcon,
} from "lucide-react";
import { UniversityAvatar } from "@/components/content/Cards";
import { Container } from "@/components/layout/PageShell";
import { Accordion, ImportantCallout, NextSteps, Step } from "@/components/ui/Blocks";
import { ButtonLink } from "@/components/ui/Button";
import { Chip, HecBadge, SourceBadge, VerificationBadge } from "@/components/ui/Chip";
import { ShareButton } from "@/components/ui/ShareButton";
import { getUniversity, listFields, listUniversitySlugs, type ProgrammeSummary } from "@/lib/data/public";
import { formatFeeRange, formatLongDate } from "@/lib/format";
import { contact } from "@/lib/nav";

type Props = { params: Promise<{ slug: string }> };

export const revalidate = 300;

export async function generateStaticParams() {
  return (await listUniversitySlugs()).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const university = await getUniversity(slug);
  if (!university) return { title: "University" };
  return { title: university.name, description: university.overview ?? undefined };
}

/** Typical steps from Figma, shown until a researcher writes this university's own. */
const typicalSteps = [
  { title: "Check you’re eligible", text: "Read the subject and grade requirements for your programme." },
  { title: "Register on the admissions portal", text: "Create an account on the university’s official portal only." },
  { title: "Fill in the form and upload documents", text: "Keep scans of your CNIC or B-Form, results and photos ready." },
  { title: "Pay the application fee", text: "Use only the payment methods listed on the official website." },
  { title: "Take the admission test, if there is one", text: "Check the test date and what it covers early." },
];

/** One step per line, with any "1." or "-" marker removed. */
function stepsFrom(text: string | null) {
  return (text ?? "")
    .split(/\r?\n/)
    .map((line) => line.replace(/^\s*(?:\d+[.)]|[-*•])\s*/, "").trim())
    .filter(Boolean);
}

const TBC = "To be confirmed";

export default async function UniversityPage({ params }: Props) {
  const { slug } = await params;
  const [university, fields] = await Promise.all([getUniversity(slug), listFields()]);
  if (university === null) {
    return (
      <Container className="py-12">
        <p className="rounded-2xl bg-tint-lavender p-5 text-body-m" role="status">
          The database isn&apos;t connected yet. Add the Supabase environment variables to see this university.
        </p>
      </Container>
    );
  }
  if (!university) notFound();
  const u = university;

  const fee = formatFeeRange(u.fee_min_pkr, u.fee_max_pkr);
  const location = u.campuses_note ?? u.city;
  const ownSteps = stepsFrom(u.how_to_apply);
  const tests = [...new Set([u.admission_test, ...u.programmes.map((p) => p.entryTest)].filter((t): t is string => !!t))];
  const requirements = u.programmes.filter((p) => p.entryRequirements);

  // Programmes grouped by field, in the order the fields are listed.
  const fieldList = fields ?? [];
  const groups = [
    ...fieldList.map((f) => ({ key: f.id, name: f.name, slug: f.slug as string | null, items: u.programmes.filter((p) => p.fieldId === f.id) })),
    {
      key: "other",
      name: "Other programmes",
      slug: null,
      items: u.programmes.filter((p) => !p.fieldId || !fieldList.some((f) => f.id === p.fieldId)),
    },
  ].filter((g) => g.items.length > 0);

  const dateTbc = "Dates to be confirmed";

  return (
    <>
      <Container className="pt-5 lg:pt-4">
        <nav aria-label="Breadcrumb" className="hidden items-center gap-1.5 text-body-s lg:flex">
          <Link
            href="/universities"
            className="py-2.5 text-label-m text-deep-rose underline underline-offset-2 hover:text-charcoal"
          >
            Universities
          </Link>
          <ChevronRight className="size-4" strokeWidth={1.75} aria-hidden="true" />
          <span aria-current="page" className="text-muted">
            {u.name}
          </span>
        </nav>

        <header className="flex flex-col gap-3 lg:grid lg:grid-cols-[minmax(0,1fr)_380px] lg:gap-x-12 lg:gap-y-3.5 lg:pt-4 lg:pb-10">
          <div className="flex flex-col gap-3 lg:col-start-1 lg:row-start-1 lg:gap-3.5">
            <div className="flex items-center gap-3 lg:gap-3.5">
              <UniversityAvatar slug={u.slug} name={u.name} shortName={u.short_name} size="lg" />
              {u.hec_recognised && <HecBadge />}
            </div>
            <h1 className="text-h1 lg:text-[60px] lg:leading-[64px] lg:tracking-[-0.9px]">{u.name}</h1>
            <div className="flex flex-wrap items-center gap-x-2.5 gap-y-2">
              <span className="flex items-center gap-1 text-body-s text-muted lg:text-body-m">
                <MapPin className="size-4" strokeWidth={1.75} aria-hidden="true" />
                {location}
              </span>
              {u.type && <Chip tone="lavender">{u.type === "public" ? "Public" : "Private"}</Chip>}
              {u.women_only && <Chip tone="coral">Women only</Chip>}
            </div>
            <p className="text-body-m text-muted lg:max-w-[680px] lg:text-body-l">
              {u.overview ?? "An overview of this university is to be confirmed."}
            </p>
          </div>

          <div className="order-1 flex flex-col gap-2.5 pt-1 lg:order-none lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:gap-3 lg:rounded-3xl lg:border lg:border-border-soft lg:bg-card lg:p-6 lg:pt-6">
            {u.website_url ? (
              <ButtonLink href={u.website_url} external className="w-full">
                Visit official website
              </ButtonLink>
            ) : (
              <p className="rounded-2xl bg-tint-lavender p-3.5 text-center text-body-s">
                Official website to be confirmed.
              </p>
            )}
            <ShareButton variant="whatsapp" title={`${u.name} on Humraah`} className="w-full" />
            <div className="hidden flex-col gap-3 lg:flex">
              <span className="h-px bg-border-soft" aria-hidden="true" />
              <FactRow icon={FileText} label="Fees" value={fee ?? TBC} />
              <FactRow icon={Pencil} label="Admission test" value={u.admission_test ?? TBC} />
              <FactRow icon={Calendar} label="Applications" value={u.admissions_window ?? dateTbc} />
            </div>
          </div>

          <div className="order-2 grid grid-cols-3 gap-2.5 pt-1 lg:hidden">
            <FactTile icon={FileText} label="Fees" value={fee ?? TBC} />
            <FactTile icon={Pencil} label="Admission test" value={u.admission_test ?? TBC} />
            <FactTile icon={Calendar} label="Applications" value={u.admissions_window ?? dateTbc} />
          </div>

          <div className="order-3 flex flex-wrap items-center gap-2 pt-1 lg:order-none lg:col-start-1 lg:row-start-2 lg:gap-2.5 lg:pt-1">
            <VerificationBadge verifiedAt={u.last_verified_at} />
            {u.last_verified_at && (
              <p className="text-caption text-muted">Last verified {formatLongDate(u.last_verified_at)}</p>
            )}
            {u.source_url && <SourceBadge url={u.source_url} />}
          </div>
        </header>
      </Container>

      <Container className="flex flex-col gap-5 pt-7 pb-6 lg:grid lg:grid-cols-[minmax(0,1fr)_380px] lg:items-start lg:gap-x-12 lg:pt-2 lg:pb-16">
        <section aria-labelledby="apply-heading" className="flex flex-col gap-2.5 lg:gap-3">
          <h2 id="apply-heading" className="text-h2">
            Everything you need to apply
          </h2>

          <Accordion icon={GraduationCap} title="Programmes" defaultOpen>
            {groups.length === 0 ? (
              <p className="border-t border-border-soft pt-3 text-body-s text-muted">
                Programmes to be confirmed. Check the official website for the full list.
              </p>
            ) : (
              <ul className="flex flex-col gap-3 lg:grid lg:grid-cols-3">
                {groups.map((g) => (
                  <li key={g.key}>
                    <GroupRow name={g.name} slug={g.slug} items={g.items} />
                  </li>
                ))}
              </ul>
            )}
            <p className="text-caption text-muted">
              Programme names and seats change each year. Confirm them on the official website.
            </p>
          </Accordion>

          <Accordion icon={ListChecks} title="How to apply" defaultOpen>
            {ownSteps.length >= 2 ? (
              <>
                <p className="text-body-s text-muted">Confirm each step on the official admissions page.</p>
                <ol>
                  {ownSteps.map((text, i) => (
                    <Step key={text} number={i + 1} title={text} last={i === ownSteps.length - 1} />
                  ))}
                </ol>
              </>
            ) : ownSteps.length === 1 ? (
              <p className="text-body-m">{ownSteps[0]}</p>
            ) : (
              <>
                <p className="text-body-s text-muted">
                  Typical steps. Confirm each one on the official admissions page.
                </p>
                <ol>
                  {typicalSteps.map((step, i) => (
                    <Step key={step.title} number={i + 1} title={step.title} last={i === typicalSteps.length - 1}>
                      {step.text}
                    </Step>
                  ))}
                </ol>
              </>
            )}
          </Accordion>

          <Accordion icon={ShieldCheck} title="Admission requirements">
            {requirements.length > 0 ? (
              <ul className="flex flex-col gap-2.5">
                {requirements.map((p) => (
                  <RequirementRow key={`${p.name}-${p.level}`} programme={p} />
                ))}
              </ul>
            ) : (
              <p className="text-body-s text-muted">Admission requirements to be confirmed.</p>
            )}
          </Accordion>

          <Accordion icon={FileText} title="Fees">
            {fee || u.fee_note ? (
              <>
                {fee && <p className="text-body-m">{fee}</p>}
                {u.fee_note && <p className="text-body-s text-muted">{u.fee_note}</p>}
              </>
            ) : (
              <p className="text-body-s text-muted">Fees to be confirmed.</p>
            )}
          </Accordion>

          <Accordion icon={Award} title="Scholarships and financial aid">
            <p className="text-body-m">
              {u.need_based_aid === true
                ? "This university offers need-based financial aid."
                : u.need_based_aid === false
                  ? "No need-based financial aid is listed for this university."
                  : "Financial aid details to be confirmed."}
            </p>
            <Link
              href="/scholarships"
              className="self-start py-2.5 text-label-m text-deep-rose underline underline-offset-2 hover:text-charcoal"
            >
              Browse scholarships
            </Link>
          </Accordion>

          <Accordion icon={Calendar} title="Important dates">
            <p className="text-body-m">{u.admissions_window ?? "Application dates to be confirmed."}</p>
          </Accordion>

          <Accordion icon={Pencil} title="Tests and documents">
            <div className="flex flex-col gap-1.5">
              <h3 className="text-label-m">Admission tests</h3>
              {tests.length > 0 ? (
                <ul className="list-disc pl-5 text-body-m marker:text-muted">
                  {tests.map((t) => (
                    <li key={t}>{t}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-body-s text-muted">Admission tests to be confirmed.</p>
              )}
            </div>
            <div className="flex flex-col gap-1.5">
              <h3 className="text-label-m">Documents to prepare</h3>
              {u.required_documents.length > 0 ? (
                <ul className="list-disc pl-5 text-body-m marker:text-muted">
                  {u.required_documents.map((d) => (
                    <li key={d}>{d}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-body-s text-muted">Required documents to be confirmed.</p>
              )}
            </div>
          </Accordion>

          <Accordion icon={Globe} title="International and exchange">
            <p className="text-body-s text-muted">
              International and exchange details to be confirmed. Ask the university&apos;s admissions office.
            </p>
          </Accordion>

          <Accordion icon={ExternalLink} title="Official links">
            {u.website_url || u.admissions_url || u.source_url ? (
              <ul className="flex flex-col">
                {[
                  { label: "Official website", url: u.website_url },
                  { label: "Admissions page", url: u.admissions_url },
                  { label: "Source we checked", url: u.source_url },
                ]
                  .filter((l): l is { label: string; url: string } => !!l.url)
                  .map((l) => (
                    <li key={l.label}>
                      <ButtonLink href={l.url} variant="text" external>
                        {l.label}
                      </ButtonLink>
                    </li>
                  ))}
              </ul>
            ) : (
              <p className="text-body-s text-muted">Official links to be confirmed.</p>
            )}
          </Accordion>
        </section>

        <aside className="flex flex-col gap-4">
          <NextSteps
            items={["Note the application dates", "Check the admission requirements", "Look for a scholarship"]}
            action={{ href: "/scholarships", label: "Find scholarships" }}
          />
          <ImportantCallout title="Before you apply" className="hidden lg:block">
            Fees, eligibility and deadlines change. Always check the official website before you apply.
          </ImportantCallout>
          <p className="flex flex-wrap items-center gap-x-2 text-body-s text-muted lg:p-1">
            <CircleAlert className="size-[18px]" strokeWidth={1.75} aria-hidden="true" />
            Spotted something outdated?
            <a
              href={`mailto:${contact.email}?subject=${encodeURIComponent(`Update needed: ${u.name}`)}`}
              className="py-2.5 text-label-m text-deep-rose underline underline-offset-2 hover:text-charcoal"
            >
              Tell us
            </a>
          </p>
        </aside>
      </Container>

      {u.website_url && (
        <div className="sticky bottom-[83px] z-20 border-t border-border-soft bg-card px-5 pt-3 pb-4 shadow-bottom-bar lg:hidden">
          <ButtonLink href={u.website_url} external className="w-full">
            Visit official website
          </ButtonLink>
        </div>
      )}
    </>
  );
}

function FactTile({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string }) {
  return (
    <div className="flex min-w-0 flex-col gap-1.5 rounded-2xl border border-border-soft bg-card p-3">
      <Icon className="size-5" strokeWidth={1.75} aria-hidden="true" />
      <p className="text-caption text-muted">{label}</p>
      <p className="text-label-m break-words">{value}</p>
    </div>
  );
}

function FactRow({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 py-1">
      <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-tint-coral">
        <Icon className="size-5" strokeWidth={1.75} aria-hidden="true" />
      </span>
      <div className="min-w-0">
        <p className="text-caption text-muted">{label}</p>
        <p className="text-label-m">{value}</p>
      </div>
    </div>
  );
}

function GroupRow({ name, slug, items }: { name: string; slug: string | null; items: ProgrammeSummary[] }) {
  const body = (
    <>
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="text-label-m">{name}</span>
        <span className="text-body-s text-muted">
          {items.length} {items.length === 1 ? "programme" : "programmes"}
        </span>
        <span className="text-caption text-muted">{items.map((p) => p.name).join(", ")}</span>
      </span>
      {slug && <ChevronRight className="size-[18px] shrink-0" strokeWidth={1.75} aria-hidden="true" />}
    </>
  );
  const classes =
    "flex items-center gap-2.5 border-t border-border-soft pt-3 lg:h-full lg:rounded-[14px] lg:border-0 lg:bg-cream lg:p-3.5";
  return slug ? (
    <Link href={`/explore/${slug}`} className={`${classes} hover:bg-blush/40`}>
      {body}
    </Link>
  ) : (
    <div className={classes}>{body}</div>
  );
}

function RequirementRow({ programme: p }: { programme: ProgrammeSummary }) {
  return (
    <li className="flex flex-col gap-0.5 border-t border-border-soft pt-2.5 first:border-0 first:pt-0">
      <span className="text-label-m">{p.name}</span>
      <span className="text-body-s text-muted">{p.entryRequirements}</span>
    </li>
  );
}
