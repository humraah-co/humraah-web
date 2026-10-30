import { ExternalLink } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

/** Button/Primary, Button/Secondary and Button/Text link from Figma. */

const base =
  "inline-flex items-center justify-center gap-2 rounded-pill px-[22px] py-3.5 text-[16px] leading-5 font-semibold text-charcoal transition-colors";

export const buttonStyles = {
  primary: `${base} bg-coral hover:bg-[#e2807f]`,
  secondary: `${base} border-[1.5px] border-charcoal hover:bg-card`,
  small:
    "inline-flex items-center justify-center rounded-pill bg-coral px-4 py-2.5 text-label-m whitespace-nowrap text-charcoal transition-colors hover:bg-[#e2807f]",
  text: "inline-flex items-center py-2.5 text-label-m text-deep-rose underline underline-offset-2 hover:text-charcoal",
};

type Variant = keyof typeof buttonStyles;

export function ButtonLink({
  href,
  variant = "primary",
  external = false,
  className = "",
  children,
}: {
  href: string;
  variant?: Variant;
  /** Opens in a new tab and shows the external-link icon (Figma "Icon right"). */
  external?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  const classes = `${buttonStyles[variant]} ${className}`;
  const t = useTranslations("common");
  if (external) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={classes}>
        {children}
        {variant !== "text" && <ExternalLink className="size-5" strokeWidth={1.75} aria-hidden="true" />}
        <span className="sr-only">{t("opensInNewTab")}</span>
      </a>
    );
  }
  return (
    <Link href={href} className={classes}>
      {children}
    </Link>
  );
}
