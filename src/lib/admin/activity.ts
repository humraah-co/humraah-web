import type { ActivityLogEntry } from "@/lib/database.types";

/**
 * Plain-English lines for the activity log, e.g. "Ina Khan published
 * COMSATS University Islamabad". `actors` maps user ids to names.
 */

const contentVerbs: Record<string, (label: string) => string> = {
  created: (l) => `added ${l}`,
  updated: (l) => `updated ${l}`,
  published: (l) => `published ${l}`,
  draft: (l) => `moved ${l} back to draft`,
  archived: (l) => `archived ${l}`,
  deleted: (l) => `deleted ${l}`,
};

const teamVerbs: Record<string, (label: string) => string> = {
  invited: (l) => `invited ${l}`,
  added: (l) => `added ${l} to the team`,
  invite_resent: (l) => `resent the invite to ${l}`,
  invite_revoked: (l) => `withdrew the invite for ${l}`,
  joined: () => "joined the team",
  suspended: (l) => `suspended ${l}`,
  reactivated: (l) => `reactivated ${l}`,
  role_changed: (l) => `changed the role of ${l}`,
  removed: (l) => `removed ${l} from the team`,
  updated: (l) => `updated ${l}’s details`,
};

const nouns: Record<string, string> = {
  universities: "a university",
  scholarships: "a scholarship",
  resources: "a resource",
  fields: "a field of study",
  guidance_articles: "a guidance article",
  team_members: "a team member",
};

export function actorName(actorId: string | null, actors: Map<string, string>) {
  // No actor: seeding, or a change made with the service-role key.
  if (!actorId) return "The system";
  return actors.get(actorId) ?? "A former team member";
}

export function describeActivity(entry: ActivityLogEntry, actors: Map<string, string>) {
  const label = entry.summary ?? nouns[entry.entity_type] ?? "an entry";
  const verbs = entry.entity_type === "team_members" ? teamVerbs : contentVerbs;
  const verb = verbs[entry.action] ?? ((l: string) => `changed ${l} (${entry.action})`);
  return `${actorName(entry.actor_id, actors)} ${verb(label)}`;
}
