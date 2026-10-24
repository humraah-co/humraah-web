/**
 * The Higher Education Guide PDFs. Set `url` (a path under /public or a full
 * https:// link) and `size` (e.g. "3.2 MB") when a file is ready. While `url`
 * is null the /guide page shows "Coming soon" instead of a download button,
 * so there is never a broken link.
 */
export type GuidePdf = {
  language: "English" | "Urdu";
  /** Shown beside the language name, e.g. اردو. */
  nativeName?: string;
  url: string | null;
  size: string | null;
};

export const guidePdfs: GuidePdf[] = [
  { language: "English", url: null, size: null },
  { language: "Urdu", nativeName: "اردو", url: null, size: null },
];

/** "What's inside", in the order of the printed guide. */
export const guideChapters = [
  { title: "A note from Humraah", summary: "Why we made this guide, and who it’s for." },
  { title: "Why higher education matters", summary: "What higher education is and how it can help you." },
  { title: "Discover yourself", summary: "What you enjoy, what you’re good at, and your top three." },
  { title: "Exploring your options", summary: "Ten popular fields and what you might enjoy in each." },
  {
    title: "Finding the right university",
    summary: "How to research universities and pay for your studies.",
  },
  { title: "Build your path", summary: "Your interest, your options and your next step." },
];
