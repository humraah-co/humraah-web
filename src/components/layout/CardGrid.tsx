/**
 * Cards in a real grid: one column on phones, two from 768 px (three on wide
 * screens with `wide`). Every card in a row stretches to the tallest, so the
 * rows line up. Each card fills its cell (`h-full`) and pins its own footer
 * to the bottom. `extra` (a note) spans the full width after the last card, from 1024 px (smaller screens show it themselves).
 */
export function CardGrid({
  items,
  extra,
  wide = false,
  as: List = "ul",
}: {
  items: { key: string; node: React.ReactNode }[];
  extra?: React.ReactNode;
  /** Three columns from 1280 px, for pages with no side panel. */
  wide?: boolean;
  /** "ol" for a numbered list. */
  as?: "ul" | "ol";
}) {
  return (
    <List className={`grid grid-cols-1 gap-3.5 md:grid-cols-2 lg:gap-6 ${wide ? "xl:grid-cols-3" : ""}`}>
      {items.map((item) => (
        <li key={item.key} className="flex min-w-0">
          {item.node}
        </li>
      ))}
      {extra && <li className="hidden lg:col-span-full lg:block">{extra}</li>}
    </List>
  );
}
