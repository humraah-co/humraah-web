/**
 * A small Markdown reader for guidance articles. It understands only what the
 * articles use: ## headings, paragraphs, - and 1. lists, > quotes, **bold**,
 * *italic*, [links](https://…) and bare https:// links.
 *
 * It produces plain data, never HTML. The renderer turns that data into React
 * elements, so text is always escaped: any HTML typed into an article shows
 * as text and can't run. Links are kept only for http(s), mailto and paths on
 * this site; anything else (javascript:, data: …) is shown as plain text.
 */

export type Inline =
  | { type: "text"; text: string }
  | { type: "strong"; children: Inline[] }
  | { type: "em"; children: Inline[] }
  | { type: "link"; href: string; children: Inline[] };

export type Block =
  | { type: "heading"; level: 2 | 3; children: Inline[] }
  | { type: "paragraph"; children: Inline[] }
  | { type: "list"; ordered: boolean; items: Inline[][] }
  | { type: "quote"; children: Inline[] }
  /** A run of "## 1. Title" or "## Step 1: Title" headings with what follows each. */
  | { type: "steps"; steps: { title: Inline[]; body: Block[] }[] };

/** The link target if it is safe to follow, otherwise null. */
export function safeHref(raw: string) {
  const href = raw.trim();
  if (/^https?:\/\//i.test(href) || /^mailto:/i.test(href)) return href;
  if (href.startsWith("/") && !href.startsWith("//")) return href;
  if (href.startsWith("#")) return href;
  return null;
}

const inlinePattern =
  /\*\*([^*]+)\*\*|\*([^*\s][^*]*)\*|_([^_\s][^_]*)_|\[([^\]]+)\]\(((?:[^()\s]|\([^()\s]*\))+)\)|(https?:\/\/[^\s<>()]+[^\s<>().,;:!?'"])/;

export function parseInline(text: string): Inline[] {
  const out: Inline[] = [];
  let rest = text;
  while (rest) {
    const m = inlinePattern.exec(rest);
    if (!m) {
      out.push({ type: "text", text: rest });
      break;
    }
    if (m.index > 0) out.push({ type: "text", text: rest.slice(0, m.index) });
    const [whole, bold, em1, em2, linkText, linkHref, bare] = m;
    if (bold !== undefined) out.push({ type: "strong", children: parseInline(bold) });
    else if (em1 !== undefined || em2 !== undefined)
      out.push({ type: "em", children: parseInline(em1 ?? em2) });
    else if (linkText !== undefined) {
      const href = safeHref(linkHref);
      out.push(
        href ? { type: "link", href, children: parseInline(linkText) } : { type: "text", text: linkText },
      );
    } else if (bare !== undefined)
      out.push({ type: "link", href: bare, children: [{ type: "text", text: bare }] });
    rest = rest.slice(m.index + whole.length);
  }
  return out;
}

const stepHeading = /^(?:step\s+)?(\d+)\s*[.:)]\s+(.+)$/i;

function parseBlocks(source: string): Block[] {
  const lines = source.replace(/\r\n?/g, "\n").split("\n");
  const blocks: Block[] = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i].trim();
    if (!line) {
      i++;
      continue;
    }
    const heading = /^(#{1,6})\s+(.*)$/.exec(line);
    if (heading) {
      // # and ## read as section headings (the page title is the article title); ### and below as sub-headings.
      blocks.push({
        type: "heading",
        level: heading[1].length <= 2 ? 2 : 3,
        children: parseInline(heading[2]),
      });
      i++;
      continue;
    }
    if (/^[-*•]\s+/.test(line) || /^\d+[.)]\s+/.test(line)) {
      const ordered = /^\d/.test(line);
      const marker = ordered ? /^\d+[.)]\s+/ : /^[-*•]\s+/;
      const items: Inline[][] = [];
      while (i < lines.length && marker.test(lines[i].trim())) {
        items.push(parseInline(lines[i].trim().replace(marker, "")));
        i++;
      }
      blocks.push({ type: "list", ordered, items });
      continue;
    }
    if (line.startsWith(">")) {
      const quoted: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith(">")) {
        quoted.push(lines[i].trim().replace(/^>\s?/, ""));
        i++;
      }
      blocks.push({ type: "quote", children: parseInline(quoted.join(" ")) });
      continue;
    }
    const para: string[] = [];
    while (i < lines.length) {
      const next = lines[i].trim();
      if (
        !next ||
        /^#{1,6}\s/.test(next) ||
        /^[-*•]\s+/.test(next) ||
        /^\d+[.)]\s+/.test(next) ||
        next.startsWith(">")
      )
        break;
      para.push(next);
      i++;
    }
    blocks.push({ type: "paragraph", children: parseInline(para.join(" ")) });
  }
  return blocks;
}

/**
 * Parses an article. Numbered level-2 headings ("## 1. Check recognition",
 * "## Step 1: Start with the subject") and the blocks under each become one
 * "steps" block, drawn as the Figma Step component.
 */
export function parseMarkdown(source: string): Block[] {
  const flat = parseBlocks(source);
  const out: Block[] = [];
  for (let i = 0; i < flat.length; i++) {
    const block = flat[i];
    const title = block.type === "heading" && block.level === 2 ? stepTitle(block.children) : null;
    if (!title) {
      out.push(block);
      continue;
    }
    const body: Block[] = [];
    while (
      i + 1 < flat.length &&
      !(flat[i + 1].type === "heading" && (flat[i + 1] as { level: number }).level === 2)
    )
      body.push(flat[++i]);
    const last = out.at(-1);
    if (last?.type === "steps") last.steps.push({ title, body });
    else out.push({ type: "steps", steps: [{ title, body }] });
  }
  return out;
}

/** The heading without its number when it is a numbered step, otherwise null. */
function stepTitle(children: Inline[]) {
  const [first, ...rest] = children;
  if (first?.type !== "text") return null;
  const m = stepHeading.exec(first.text);
  if (!m) return null;
  return [{ type: "text" as const, text: m[2] }, ...rest];
}

/** Plain text of some inline content, e.g. for a heading's id. */
export function plainText(nodes: Inline[]): string {
  return nodes.map((n) => (n.type === "text" ? n.text : plainText(n.children))).join("");
}
