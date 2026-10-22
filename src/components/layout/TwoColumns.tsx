/**
 * Cards in one column on phones and two independent columns on desktop, as in
 * the Figma grids. Items alternate between the columns (1st left, 2nd right),
 * so each column keeps its own height. `extra` goes under the shorter column on
 * desktop (the right one on a tie).
 */
export function TwoColumns({
  items,
  extra,
}: {
  items: { key: string; node: React.ReactNode }[];
  extra?: React.ReactNode;
}) {
  const left = items.filter((_, i) => i % 2 === 0);
  const right = items.filter((_, i) => i % 2 === 1);
  const extraLeft = extra && left.length < right.length;
  const column = (list: typeof items, withExtra: boolean) => (
    <ul className="flex min-w-0 flex-1 flex-col gap-4">
      {list.map((item) => (
        <li key={item.key} className="flex flex-col *:flex-1">
          {item.node}
        </li>
      ))}
      {withExtra && <li>{extra}</li>}
    </ul>
  );
  return (
    <>
      <ul className="flex flex-col gap-3 lg:hidden">
        {items.map((item) => (
          <li key={item.key} className="flex flex-col *:flex-1">
            {item.node}
          </li>
        ))}
      </ul>
      <div className="hidden items-start gap-6 lg:flex">
        {column(left, !!extraLeft)}
        {column(right, !!extra && !extraLeft)}
      </div>
    </>
  );
}
