import type { ActivityLogEntry } from "@/lib/database.types";

/**
 * Plain-English lines for the activity log, e.g. "Ina Khan published
 * COMSATS University Islamabad". `actors` maps user ids to names.
 */

const contentVerbs: Record<string, (label: string) => string> = {
  created: (l) => `added ${l}`,
  updated: (l) => `updated ${l}`,
  verified: (l) => `marked ${l} as verified`,
  published: (l) => `published ${l}`,
  draft: (l) => `moved ${l} back to draft`,
  archived: (l) => `archived ${l}`,
  restored: (l) => `restored ${l} to drafts`,
  deleted: (l) => `deleted ${l}`,
  // Contact messages (the label is "a contact message", never the sender).
  read: (l) => `marked ${l} as read`,
  unread: (l) => `marked ${l} as unread`,
  unarchived: (l) => `took ${l} out of the archive`,
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
  contact_messages: "a contact message",
  team_members: "a team member",
};

export function actorName(actorId: string | null, actors: Map<string, string>) {
  // No actor: seeding, or a change made with the service-role key.
  if (!actorId) return "The system";
  return actors.get(actorId) ?? "A former team member";
}

export function describeActivity(entry: ActivityLogEntry, actors: Map<string, string>) {
  const label = entry.summary ?? nouns[entry.entity_type] ?? "an entry";
  // Team rows added outside the invite flow (e.g. the first owner, set up by hand).
  if (entry.entity_type === "team_members" && entry.action === "created") {
    return `${label} was added to the team`;
  }
  const verbs = entry.entity_type === "team_members" ? teamVerbs : contentVerbs;
  const verb = verbs[entry.action] ?? ((l: string) => `changed ${l} (${entry.action})`);
  return `${actorName(entry.actor_id, actors)} ${verb(label)}`;
}
