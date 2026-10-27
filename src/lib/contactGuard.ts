import { createHmac } from "node:crypto";

/** A person needs more than this to read and fill in the form; simple bots post at once. */
export const MIN_FILL_MS = 3000;
/** Longer than any real visit; a bigger number is made up. */
const MAX_FILL_MS = 1000 * 60 * 60 * 24;

/** Messages allowed per sender in the window (see check_contact_rate). */
export const RATE_LIMIT = 5;

/**
 * Whether a submission looks like a bot: the hidden "website" field was
 * filled in, or the time between the form appearing and Send is missing,
 * made up or too short. The time comes from the browser's own stopwatch
 * (see ContactForm), so a wrong clock on someone's phone can't trip it.
 */
export function looksLikeBot(form: FormData) {
  const website = form.get("website");
  if (typeof website === "string" && website !== "") return true;
  const elapsed = Number(form.get("elapsed"));
  return !Number.isFinite(elapsed) || elapsed < MIN_FILL_MS || elapsed > MAX_FILL_MS;
}

/** The visitor's address as Vercel reports it, or null when there isn't one (local development). */
export function clientIp(headers: Headers) {
  const forwarded = headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || headers.get("x-real-ip")?.trim() || null;
}

/**
 * A keyed hash of an address: stable for one address, but not reversible
 * without CONTACT_IP_HASH_SECRET. The raw address is never stored or logged.
 * Returns null when the secret isn't set.
 */
export function hashIp(ip: string, secret = process.env.CONTACT_IP_HASH_SECRET) {
  if (!secret) return null;
  return createHmac("sha256", secret).update(ip).digest("hex");
}
