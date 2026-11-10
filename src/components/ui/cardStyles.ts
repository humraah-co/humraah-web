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
  /** A card title: two lines at most, then an ellipsis. Clamped by lines, so Urdu keeps its taller lines. */
  title: "line-clamp-2 text-label-l",
  /** A card description: two lines at most, then an ellipsis; the full text is on the page the card opens. */
  description: "line-clamp-2 text-body-s text-muted",
  /** The small line right under a description (read time, site): a fixed gap, never pushed to the foot of the card. */
  meta: "mt-1",
  /** For cards that are links. */
  hover: "transition-colors hover:border-border-strong focus-visible:border-border-strong",
} as const;
