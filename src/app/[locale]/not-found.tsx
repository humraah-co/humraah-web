import Link from "next/link";
import { Container } from "@/components/layout/PageShell";
import { ButtonLink } from "@/components/ui/Button";

const places = [
  { href: "/explore", label: "Explore fields" },
  { href: "/universities", label: "Universities" },
  { href: "/scholarships", label: "Scholarships" },
  { href: "/guidance", label: "Guidance" },
];

export default function NotFound() {
  return (
    <Container className="py-16 text-center lg:py-24">
      <p className="text-script text-deep-rose">This path doesn&apos;t lead anywhere yet.</p>
      <h1 className="mt-3 text-h1">We couldn&apos;t find that page</h1>
      <p className="mx-auto mt-3 max-w-md text-body-m text-muted">
        It may have moved, or the link may be wrong. Let&apos;s get you back on track.
      </p>
      <ButtonLink href="/" className="mt-6">
        Go to the home page
      </ButtonLink>
      <nav aria-label="Popular pages" className="mt-6">
        <p className="text-label-s text-muted">Or try</p>
        <ul className="mt-1 flex flex-wrap justify-center gap-x-5">
          {places.map((p) => (
            <li key={p.href}>
              <Link
                href={p.href}
                className="inline-block py-2.5 text-label-m text-deep-rose underline underline-offset-2 hover:text-charcoal"
              >
                {p.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </Container>
  );
}
