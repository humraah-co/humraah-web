import { listUpcomingDeadlines } from "@/lib/data/public";

// Rebuilt at most once an hour; the bell on every page reads this instead of
// asking the database. The ".json" in the address keeps it out of the
// language middleware, which skips anything with a file extension.
export const revalidate = 3600;

export async function GET() {
  const deadlines = await listUpcomingDeadlines();
  return Response.json(
    { deadlines },
    { headers: { "Cache-Control": "public, max-age=300, s-maxage=3600, stale-while-revalidate=86400" } },
  );
}
