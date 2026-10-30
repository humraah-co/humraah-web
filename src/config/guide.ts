/**
 * The Higher Education Guide PDFs. Set `url` (a path under /public or a full
 * https:// link) and `size` (e.g. "3.2 MB") when a file is ready. While `url`
 * is null the /guide page shows "Coming soon" instead of a download button,
 * so there is never a broken link.
 */
export type GuidePdf = {
  /** The guide's language; its name comes from the "guide.languages" messages. */
  language: "en" | "ur";
  /** Shown beside the language name, e.g. اردو. */
  nativeName?: string;
  url: string | null;
  size: string | null;
};

export const guidePdfs: GuidePdf[] = [
  { language: "en", url: null, size: null },
  { language: "ur", nativeName: "اردو", url: null, size: null },
];

/** "What's inside", in the order of the printed guide. Titles and summaries are in "guide.chapters". */
export const guideChapters = ["note", "why", "discover", "options", "university", "path"] as const;
