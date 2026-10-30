/**
 * Fields of study, resources and guidance articles in the admin portal: what
 * the editors hold, how they're checked, and how a form becomes a database
 * row. The same shape as the university and scholarship editors in
 * ./content, which this builds on. Shared by the editors (in the browser)
 * and their server actions, which check again.
 */

import type { ContentStatus, Field, GuidanceArticle, Resource, ResourceCategory } from "@/lib/database.types";
import {
  lengthErrors,
  link,
  list,
  oneOf,
  orNull,
  slugError,
  sourceError,
  str,
  t,
  urduFrom,
  urduList,
  urlError,
  type FieldErrors,
  type SaveIntent,
} from "./content";

type UrduOf<K extends readonly string[]> = Record<K[number], string>;

/** The quiz scores these ten by web address, so they keep it (the database refuses a change too). */
export const quizFieldSlugs = [
  "business-management",
  "engineering",
  "computing-technology",
  "medicine-health",
  "social-behavioural-sciences",
  "humanities-languages",
  "arts-design-architecture",
  "natural-applied-sciences",
  "law",
  "education",
] as const;

export const isQuizField = (slug: string) => (quizFieldSlugs as readonly string[]).includes(slug);

/** Where the entry shows among the others on the public page: lowest first. */
const ORDER_MAX = 9999;
const orderError = (value: string) => {
  if (!t(value)) return;
  const n = Number(t(value));
  if (!Number.isInteger(n) || n < 0 || n > ORDER_MAX) {
    return `Use a whole number from 0 to ${ORDER_MAX}. Lower numbers come first.`;
  }
};
const orderNumber = (value: string) => (t(value) ? Number(t(value)) : 0);
const orderText = (n: number) => String(n);

/** Chips and short labels: a handful, each a few words. */
const ITEM_MAX = 80;
const ITEMS_MAX = 20;
function itemsError(value: string, noun: string) {
  const items = list(value);
  if (items.length > ITEMS_MAX) return `Please keep this to ${ITEMS_MAX} ${noun} or fewer.`;
  if (items.some((item) => item.length > ITEM_MAX)) {
    return `Each line should be under ${ITEM_MAX} characters, as it’s shown as a short label.`;
  }
}

// ---------------------------------------------------------------------------
// Fields of study
// ---------------------------------------------------------------------------

/** Urdu versions, all optional. Example programme names stay in English, so they have none. */
export const fieldUrduKeys = ["name_ur", "summary_ur", "you_might_enjoy_ur", "interests_ur"] as const;

export type FieldValues = UrduOf<typeof fieldUrduKeys> & {
  name: string;
  slug: string;
  summary: string;
  you_might_enjoy: string;
  interests: string;
  example_programmes: string;
  sort_order: string;
  source_url: string;
};

export const emptyField: FieldValues = {
  name: "",
  slug: "",
  summary: "",
  you_might_enjoy: "",
  interests: "",
  example_programmes: "",
  sort_order: "0",
  source_url: "",
  ...(Object.fromEntries(fieldUrduKeys.map((k) => [k, ""])) as UrduOf<typeof fieldUrduKeys>),
};

const lines = (items: string[]) => items.join("\n");

export function fieldToValues(f: Field): FieldValues {
  return {
    name: f.name,
    slug: f.slug,
    summary: f.summary ?? "",
    you_might_enjoy: f.you_might_enjoy ?? "",
    interests: lines(f.interests),
    example_programmes: lines(f.example_programmes),
    sort_order: orderText(f.sort_order),
    source_url: f.source_url ?? "",
    name_ur: f.name_ur ?? "",
    summary_ur: f.summary_ur ?? "",
    you_might_enjoy_ur: f.you_might_enjoy_ur ?? "",
    interests_ur: lines(f.interests_ur ?? []),
  };
}

export function parseField(raw: unknown): FieldValues {
  const r = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  return {
    name: str(r.name),
    slug: str(r.slug),
    summary: str(r.summary),
    you_might_enjoy: str(r.you_might_enjoy),
    interests: str(r.interests),
    example_programmes: str(r.example_programmes),
    sort_order: str(r.sort_order),
    source_url: link(r.source_url),
    ...urduFrom(r, fieldUrduKeys),
  };
}

export function validateField(v: FieldValues, intent: SaveIntent, status: ContentStatus) {
  const errors: FieldErrors = {};
  const set = (key: string, message: string | undefined) => {
    if (message) errors[key] = message;
  };
  set("name", t(v.name) ? undefined : "Please enter the field’s name.");
  set("slug", slugError(v.slug));
  set("sort_order", orderError(v.sort_order));
  set("interests", itemsError(v.interests, "interests"));
  set("example_programmes", itemsError(v.example_programmes, "programmes"));
  set("interests_ur", itemsError(v.interests_ur, "interests"));
  set("source_url", urlError(v.source_url) ?? sourceError(intent, status, v.source_url));
  lengthErrors(errors, v, ["summary", "summary_ur"]);
  return errors;
}

export const fieldLabels: Record<string, string> = {
  name: "Name",
  slug: "Web address",
  summary: "Summary",
  you_might_enjoy: "You might enjoy this if you like",
  interests: "Interests (short labels)",
  example_programmes: "Example programmes",
  sort_order: "Order on the page",
  source_url: "Official source link",
  name_ur: "Name (Urdu)",
  summary_ur: "Summary (Urdu)",
  you_might_enjoy_ur: "You might enjoy this if you like (Urdu)",
  interests_ur: "Interests (Urdu)",
};

export function fieldRow(v: FieldValues, status: ContentStatus) {
  return {
    values: {
      name: t(v.name),
      slug: t(v.slug),
      summary: orNull(v.summary),
      you_might_enjoy: orNull(v.you_might_enjoy),
      interests: list(v.interests),
      example_programmes: list(v.example_programmes),
      sort_order: orderNumber(v.sort_order),
      source_url: orNull(v.source_url),
      status,
      name_ur: orNull(v.name_ur),
      summary_ur: orNull(v.summary_ur),
      you_might_enjoy_ur: orNull(v.you_might_enjoy_ur),
      interests_ur: urduList(v.interests_ur),
    },
  };
}

// ---------------------------------------------------------------------------
// Resources
// ---------------------------------------------------------------------------

/** The headings the Resources page groups links under. */
export const resourceCategoryLabels: Record<ResourceCategory, string> = {
  official: "HEC and official resources",
  scholarships: "Scholarships",
  tests: "Admission tests",
  guidance: "Career exploration",
};
const resourceCategories = Object.keys(resourceCategoryLabels) as ResourceCategory[];

export const resourceUrduKeys = ["title_ur", "description_ur"] as const;

export type ResourceValues = UrduOf<typeof resourceUrduKeys> & {
  title: string;
  url: string;
  category: "" | ResourceCategory;
  description: string;
  sort_order: string;
  source_url: string;
};

export const emptyResource: ResourceValues = {
  title: "",
  url: "",
  category: "",
  description: "",
  sort_order: "0",
  source_url: "",
  title_ur: "",
  description_ur: "",
};

export function resourceToValues(r: Resource): ResourceValues {
  return {
    title: r.title,
    url: r.url,
    category: r.category,
    description: r.description ?? "",
    sort_order: orderText(r.sort_order),
    source_url: r.source_url ?? "",
    title_ur: r.title_ur ?? "",
    description_ur: r.description_ur ?? "",
  };
}

export function parseResource(raw: unknown): ResourceValues {
  const r = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  return {
    title: str(r.title),
    url: link(r.url),
    category: oneOf(r.category, ["", ...resourceCategories] as const, ""),
    description: str(r.description),
    sort_order: str(r.sort_order),
    source_url: link(r.source_url),
    ...urduFrom(r, resourceUrduKeys),
  };
}

export function validateResource(v: ResourceValues, intent: SaveIntent, status: ContentStatus) {
  const errors: FieldErrors = {};
  const set = (key: string, message: string | undefined) => {
    if (message) errors[key] = message;
  };
  set("title", t(v.title) ? undefined : "Please enter the resource’s title.");
  set("url", t(v.url) ? urlError(v.url) : "Please enter the link people should open.");
  set("category", v.category ? undefined : "Please choose where this link belongs on the page.");
  set("sort_order", orderError(v.sort_order));
  set("source_url", urlError(v.source_url) ?? sourceError(intent, status, v.source_url));
  lengthErrors(errors, v, [], { description: 400, description_ur: 400 });
  return errors;
}

export const resourceLabels: Record<string, string> = {
  title: "Title",
  url: "Link",
  category: "Group on the page",
  description: "Description",
  sort_order: "Order in its group",
  source_url: "Official source link",
  title_ur: "Title (Urdu)",
  description_ur: "Description (Urdu)",
};

export function resourceRow(v: ResourceValues, status: ContentStatus) {
  return {
    values: {
      title: t(v.title),
      url: t(v.url),
      category: v.category,
      description: orNull(v.description),
      sort_order: orderNumber(v.sort_order),
      source_url: orNull(v.source_url),
      status,
      title_ur: orNull(v.title_ur),
      description_ur: orNull(v.description_ur),
    },
  };
}

// ---------------------------------------------------------------------------
// Guidance articles
// ---------------------------------------------------------------------------

export const guidanceUrduKeys = ["title_ur", "summary_ur", "body_markdown_ur"] as const;

export type GuidanceValues = UrduOf<typeof guidanceUrduKeys> & {
  title: string;
  slug: string;
  summary: string;
  body_markdown: string;
  sort_order: string;
  source_url: string;
};

export const emptyGuidance: GuidanceValues = {
  title: "",
  slug: "",
  summary: "",
  body_markdown: "",
  sort_order: "0",
  source_url: "",
  title_ur: "",
  summary_ur: "",
  body_markdown_ur: "",
};

export function guidanceToValues(a: GuidanceArticle): GuidanceValues {
  return {
    title: a.title,
    slug: a.slug,
    summary: a.summary ?? "",
    body_markdown: a.body_markdown,
    sort_order: orderText(a.sort_order),
    source_url: a.source_url ?? "",
    title_ur: a.title_ur ?? "",
    summary_ur: a.summary_ur ?? "",
    body_markdown_ur: a.body_markdown_ur ?? "",
  };
}

export function parseGuidance(raw: unknown): GuidanceValues {
  const r = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  return {
    title: str(r.title),
    slug: str(r.slug),
    summary: str(r.summary),
    body_markdown: str(r.body_markdown),
    sort_order: str(r.sort_order),
    source_url: link(r.source_url),
    ...urduFrom(r, guidanceUrduKeys),
  };
}

/** An article is long-form: far more than the 5,000 characters of a card's text. */
export const BODY_MAX = 30_000;

export function validateGuidance(v: GuidanceValues, intent: SaveIntent, status: ContentStatus) {
  const errors: FieldErrors = {};
  const set = (key: string, message: string | undefined) => {
    if (message) errors[key] = message;
  };
  set("title", t(v.title) ? undefined : "Please enter the article’s title.");
  set("slug", slugError(v.slug));
  set("sort_order", orderError(v.sort_order));
  set("source_url", urlError(v.source_url) ?? sourceError(intent, status, v.source_url));
  // The public page shows "no text yet" for an empty article, so it can't be published like that.
  if (status === "published" && !t(v.body_markdown)) {
    errors.body_markdown = "Write the article before publishing it, or save it as a draft.";
  }
  lengthErrors(errors, v, ["summary", "summary_ur"], { body_markdown: BODY_MAX, body_markdown_ur: BODY_MAX });
  return errors;
}

export const guidanceLabels: Record<string, string> = {
  title: "Title",
  slug: "Web address",
  summary: "Summary",
  body_markdown: "Article text",
  sort_order: "Order in the list",
  source_url: "Official source link",
  title_ur: "Title (Urdu)",
  summary_ur: "Summary (Urdu)",
  body_markdown_ur: "Article text (Urdu)",
};

export function guidanceRow(v: GuidanceValues, status: ContentStatus) {
  return {
    values: {
      title: t(v.title),
      slug: t(v.slug),
      summary: orNull(v.summary),
      body_markdown: v.body_markdown.trim(),
      sort_order: orderNumber(v.sort_order),
      source_url: orNull(v.source_url),
      status,
      title_ur: orNull(v.title_ur),
      summary_ur: orNull(v.summary_ur),
      body_markdown_ur: orNull(v.body_markdown_ur),
    },
  };
}
