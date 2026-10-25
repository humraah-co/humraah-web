import { ExternalLink } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { RememberCallout, Step } from "@/components/ui/Blocks";
import { parseMarkdown, type Block, type Inline } from "@/lib/markdown";

const linkClass = "text-deep-rose underline underline-offset-2 hover:text-charcoal";

/**
 * Renders a guidance article's body_markdown. Everything becomes React
 * elements (no dangerouslySetInnerHTML), so the text is always escaped.
 * See lib/markdown for what is supported.
 */
export function Markdown({ source }: { source: string }) {
  return (
    <div className="flex flex-col gap-4">
      {parseMarkdown(source).map((block, i) => (
        <BlockView key={i} block={block} />
      ))}
    </div>
  );
}

function BlockView({ block }: { block: Block }) {
  switch (block.type) {
    case "heading":
      return block.level === 2 ? (
        <h2 className="mt-2 text-h3">
          <Inlines nodes={block.children} />
        </h2>
      ) : (
        <h3 className="text-label-l">
          <Inlines nodes={block.children} />
        </h3>
      );
    case "paragraph":
      return (
        <p className="text-body-m">
          <Inlines nodes={block.children} />
        </p>
      );
    case "list": {
      const List = block.ordered ? "ol" : "ul";
      return (
        <List
          className={`flex flex-col gap-1.5 ps-5 text-body-m marker:text-muted ${block.ordered ? "list-decimal" : "list-disc"}`}
        >
          {block.items.map((item, i) => (
            <li key={i}>
              <Inlines nodes={item} />
            </li>
          ))}
        </List>
      );
    }
    case "quote":
      return (
        <RememberCallout>
          <Inlines nodes={stripRemember(block.children)} />
        </RememberCallout>
      );
    case "steps":
      return (
        <ol>
          {block.steps.map((step, i) => (
            <Step
              key={i}
              number={i + 1}
              title={<Inlines nodes={step.title} />}
              last={i === block.steps.length - 1}
            >
              {step.body.length > 0 && (
                <div className="flex flex-col gap-2.5">
                  {step.body.map((b, j) => (
                    <BlockView key={j} block={b} />
                  ))}
                </div>
              )}
            </Step>
          ))}
        </ol>
      );
  }
}

/** The callout already says "Remember…", so a leading "Remember:" is dropped. */
function stripRemember(nodes: Inline[]): Inline[] {
  const [first, ...rest] = nodes;
  if (first?.type !== "text") return nodes;
  const text = first.text.replace(/^remember[:,.…]*\s*/i, "");
  return [{ type: "text", text: text.charAt(0).toUpperCase() + text.slice(1) }, ...rest];
}

function Inlines({ nodes }: { nodes: Inline[] }) {
  const t = useTranslations("common");
  return nodes.map((n, i) => {
    switch (n.type) {
      case "text":
        return n.text;
      case "strong":
        return (
          <strong key={i} className="font-semibold">
            <Inlines nodes={n.children} />
          </strong>
        );
      case "em":
        return (
          <em key={i}>
            <Inlines nodes={n.children} />
          </em>
        );
      case "link":
        return n.href.startsWith("/") ? (
          <Link key={i} href={n.href} className={linkClass}>
            <Inlines nodes={n.children} />
          </Link>
        ) : (
          <a key={i} href={n.href} target="_blank" rel="noopener noreferrer" className={linkClass}>
            <Inlines nodes={n.children} />
            {!n.href.startsWith("mailto:") && (
              <>
                <ExternalLink
                  className="ms-0.5 inline size-3.5 align-[-2px]"
                  strokeWidth={2}
                  aria-hidden="true"
                />
                <span className="sr-only"> {t("opensInNewTab")}</span>
              </>
            )}
          </a>
        );
    }
  });
}
