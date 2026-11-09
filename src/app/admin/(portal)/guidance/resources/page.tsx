import { redirect } from "next/navigation";

type Search = Record<string, string | string[] | undefined>;

/**
 * The Resources list lives on the combined "Guidance and resources" page.
 * The editors keep their addresses under here (/admin/guidance/resources/new
 * and /admin/guidance/resources/<id>), and the save, delete and archive
 * actions send people back to this address, so it forwards them with
 * whatever notice or filter came along.
 */
export default async function ResourcesRedirect({ searchParams }: { searchParams: Promise<Search> }) {
  const raw = await searchParams;
  const query = new URLSearchParams({ type: "resources" });
  for (const [key, value] of Object.entries(raw)) {
    if (key !== "type" && typeof value === "string") query.set(key, value);
  }
  redirect(`/admin/guidance?${query}`);
}
