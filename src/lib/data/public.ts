import "server-only";
import { createPublicClient } from "@/lib/supabase/public";

/**
 * Public data access. Every query goes through the anon client, so row-level
 * security limits results to published rows. Each function returns `null`
 * when Supabase isn't configured, and throws on a real database error.
 */

export async function getPublishedCounts() {
  const supabase = createPublicClient();
  if (!supabase) return null;

  const count = async (table: "fields" | "universities" | "scholarships" | "resources") => {
    const { count, error } = await supabase.from(table).select("*", { count: "exact", head: true });
    if (error) throw new Error(`Could not count ${table}: ${error.message}`);
    return count ?? 0;
  };

  const [fields, universities, scholarships, resources] = await Promise.all([
    count("fields"),
    count("universities"),
    count("scholarships"),
    count("resources"),
  ]);
  return { fields, universities, scholarships, resources };
}

export async function listUniversities() {
  const supabase = createPublicClient();
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("universities")
    .select("slug, name, short_name, city, campuses_note, type, women_only, last_verified_at")
    .order("name");
  if (error) throw new Error(`Could not load universities: ${error.message}`);
  return data;
}

export async function listFields() {
  const supabase = createPublicClient();
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("fields")
    .select("slug, name, emoji, you_might_enjoy, example_programmes")
    .order("sort_order");
  if (error) throw new Error(`Could not load fields: ${error.message}`);
  return data;
}
