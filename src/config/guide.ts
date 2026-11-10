/**
 * The Higher Education Guide PDFs are uploaded from the admin portal
 * (Guidance and resources, Guide PDFs) and read from the guide_files table,
 * so there is nothing to edit here for a new file. A language with no file
 * shows "Coming soon" on the Guidance page.
 */

/** The guide's languages, in the order the cards appear; names come from the "guide.languages" messages. */
export { GUIDE_LANGUAGES as guideLanguages } from "@/lib/guideFiles";
