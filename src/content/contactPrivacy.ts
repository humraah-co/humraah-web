/**
 * Contact Form Privacy Notice.
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
  title: "Contacting Humraah",
  paragraphs: [
    "If you contact Humraah through this form, we will use the information you submit to read and respond to your message and to follow up where needed. Please share only the information necessary for your enquiry. Do not include passwords, identity-document numbers, detailed financial records or other sensitive personal information in the message.",
    "Your message may be accessible to the Humraah team members responsible for managing enquiries. Before this form goes live, Humraah will confirm who can access submissions, where they are stored, how long they are kept, and how a sender can request correction or deletion. We will update this notice to reflect those practices. If you are under 18, consider asking a trusted adult for help before sharing personal information online.",
  ],
  checkboxLabel: "I have read the Contact Form Privacy Notice.",
} as const;
