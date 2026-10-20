/** Standard page width and padding: 20 px on mobile, 80 px gutters on desktop. */
export function Container({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`mx-auto w-full max-w-[1440px] px-5 lg:px-20 ${className}`}>{children}</div>;
}

/**
 * Holding page for routes that are built later this week, so every link in
 * the header, footer and bottom bar works from Day 1.
 */
export function ComingSoon({
  title,
  day,
  children,
}: {
  title: string;
  day: string;
  children?: React.ReactNode;
}) {
  return (
    <Container className="py-12 lg:py-20">
      <p className="text-label-s text-deep-rose uppercase">Coming {day}</p>
      <h1 className="mt-2 text-h1">{title}</h1>
      <p className="mt-4 max-w-xl text-body-l text-muted">
        This page is being built. Check back soon, or explore what&apos;s ready from the menu.
      </p>
      {children}
    </Container>
  );
}
