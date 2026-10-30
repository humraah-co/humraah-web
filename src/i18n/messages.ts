import { getMessages } from "next-intl/server";

/** Message namespaces the public site's client components read. */
export const CLIENT_NAMESPACES = [
  "nav",
  "language",
  "brand",
  "common",
  "badges",
  "contact",
  "privacyNotice",
  "filters",
  "share",
] as const;

/** Only the given namespaces of this request's messages, for a NextIntlClientProvider. */
export async function clientMessages(namespaces: readonly string[] = CLIENT_NAMESPACES) {
  const all = await getMessages();
  return Object.fromEntries(namespaces.filter((n) => n in all).map((n) => [n, all[n]]));
}
