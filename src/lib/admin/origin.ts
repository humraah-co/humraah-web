import "server-only";
import { headers } from "next/headers";

/**
 * The origin this request came in on (e.g. https://humraah.org or a preview
 * deployment), for the links in invite and password emails. Server actions
 * always send an Origin header, and Next checks it matches the host.
 */
export async function requestOrigin() {
  const h = await headers();
  const origin = h.get("origin");
  if (origin && /^https?:\/\/[^/]+$/.test(origin)) return origin;
  const host = h.get("x-forwarded-host") ?? h.get("host");
  if (host) return `${h.get("x-forwarded-proto") ?? "https"}://${host}`;
  return process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
}
