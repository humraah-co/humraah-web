/**
 * Contact Form Privacy Notice. The wording is in src/messages (en.json and
 * ur.json, "privacyNotice"); this file keeps its status.
 *
 * DRAFT, AWAITING APPROVAL. Wording is copied unchanged from section 4,
 * "Draft contact-form privacy wording", of the Humraah Website Content Pack
 * (draft for website team, 21 October 2026). The content pack says to
 * confirm it with the developers before publication and not to publish
 * promises about storage, deletion, security or access that the site
 * doesn't honour. Before launch, Humraah needs to confirm who can read
 * submissions, where they are stored, how long they are kept and how to ask
 * for correction or deletion, then update this text.
 *
 * What the site does today, for that review: the form collects name, email
 * and message (all required) and writes them to the contact_messages table
 * in Supabase. Only signed-in admins and the owner can read them (row-level
 * security); researchers and the public cannot. No email is sent and no
 * third-party or analytics tool receives the data. There is no retention
 * or deletion schedule yet.
 */
export const contactPrivacy = {
  /** Its wording is in the messages, under "privacyNotice" (title, these paragraphs, checkbox). */
  paragraphs: ["p1", "p2"],
} as const;
