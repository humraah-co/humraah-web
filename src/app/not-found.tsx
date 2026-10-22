import Link from "next/link";
import { Container } from "@/components/layout/PageShell";

export default function NotFound() {
  return (
    <Container className="py-16 text-center lg:py-24">
      <p className="text-script text-deep-rose">This path doesn&apos;t lead anywhere yet.</p>
      <h1 className="mt-3 text-h1">We couldn&apos;t find that page</h1>
      <p className="mx-auto mt-3 max-w-md text-body-m text-muted">
        It may have moved, or the link may be wrong. Let&apos;s get you back on track.
      </p>
      <Link
        href="/"
        className="mt-6 inline-block rounded-pill bg-coral px-6 py-3.5 text-label-l text-charcoal"
      >
        Go to the home page
      </Link>
    </Container>
  );
}
