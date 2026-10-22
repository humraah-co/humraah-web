import Link from "next/link";
import { Container } from "@/components/layout/PageShell";
import { getPublishedCounts, listUniversities } from "@/lib/data/public";

// Temporary Day 1 home: proves the design system and the database connection.
// The full Home page from Figma replaces this on Day 2.
export const revalidate = 300;

export default async function HomePage() {
  const [counts, universities] = await Promise.all([getPublishedCounts(), listUniversities()]);

  return (
    <Container className="py-10 lg:py-16">
      <p className="text-script text-deep-rose">For every girl who dreams, questions and hopes.</p>
      <h1 className="mt-3 max-w-3xl text-display">Walking alongside you, towards your dreams.</h1>
      <p className="mt-4 max-w-2xl text-body-l text-muted">
        Find out what you could study, which universities offer it and how to pay for it.
      </p>
      <div className="mt-6 flex flex-col gap-2.5 sm:flex-row">
        <Link
          href="/quiz"
          className="rounded-pill bg-coral px-6 py-3.5 text-center text-label-l text-charcoal hover:bg-[#e2807f]"
        >
          Where do I start?
        </Link>
        <Link
          href="/universities"
          className="rounded-pill border-[1.5px] border-charcoal px-6 py-3.5 text-center text-label-l text-charcoal hover:bg-card"
        >
          Find universities
        </Link>
      </div>

      {counts === null ? (
        <p className="mt-10 rounded-2xl bg-tint-lavender p-5 text-body-m" role="status">
          The database isn&apos;t connected yet. Add the Supabase environment variables to see content.
        </p>
      ) : (
        <>
          <dl className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Stat label="Fields of study" value={counts.fields} />
            <Stat label="Universities" value={counts.universities} />
            <Stat label="Scholarships" value={counts.scholarships} />
            <Stat label="Resources" value={counts.resources} />
          </dl>

          <h2 className="mt-12 text-h2">Universities you can explore</h2>
          <p className="mt-1 text-body-s text-muted">These are examples, not a ranking.</p>
          <ul className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {universities?.map((u) => (
              <li key={u.slug} className="rounded-2xl border border-border-soft bg-card p-4 shadow-soft">
                <p className="text-label-l">{u.name}</p>
                <p className="mt-1 text-body-s text-muted">
                  {u.campuses_note ?? u.city}
                  {u.type ? ` · ${u.type === "public" ? "Public" : "Private"}` : ""}
                  {u.women_only ? " · Women only" : ""}
                </p>
                {!u.last_verified_at && (
                  <p className="mt-2 inline-block rounded-pill bg-tint-coral px-2.5 py-0.5 text-label-xs text-deep-rose">
                    Not yet verified
                  </p>
                )}
              </li>
            ))}
          </ul>
        </>
      )}
    </Container>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl bg-blush p-4">
      <dt className="text-label-s text-muted">{label}</dt>
      <dd className="mt-1 font-serif text-[32px] leading-none font-semibold">{value}</dd>
    </div>
  );
}
