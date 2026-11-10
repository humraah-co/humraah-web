/**
 * The shared look of a card in a list: one radius, border, padding and
 * inner gap, so cards in different sections (and different pages) match.
 * The gaps between cards and the column counts are CardGrid's.
 */
export const cardStyles = {
  /** Radius, border colour and padding; add a background (bg-card, or a tint for a note). */
  shape: "rounded-[20px] border border-border-soft p-4 lg:p-5",
  /** Space between a card's icon or badge and its text. */
  gap: "gap-3.5",
  /** For cards that are links. */
  hover: "transition-colors hover:border-border-strong focus-visible:border-border-strong",
} as const;
