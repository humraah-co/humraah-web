/* eslint-disable @next/next/no-img-element -- tiny static SVGs; next/image adds nothing here */
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

/**
 * Logo/Horizontal from Figma (node 3:216): the H mark beside the HUMRAAH
 * wordmark with ہمراہ centred underneath. All three parts are the exact
 * vector files exported from the Figma file (public/brand).
 */
export function LogoHorizontal({
  href = "/",
  fit = "full",
}: {
  href?: string;
  fit?: keyof typeof horizontalFits;
}) {
  const f = horizontalFits[fit];
  const t = useTranslations("brand");
  return (
    <Link href={href} aria-label={t("home")} className={`flex shrink-0 items-center ${f.link}`}>
      <LogoMark className={f.mark} />
      <span className={`flex-col items-center ${f.words}`}>
        <img
          src="/brand/logo-wordmark.svg"
          alt=""
          width={116}
          height={12.876}
          className={`block ${f.wordmark}`}
        />
        <img src="/brand/logo-urdu.svg" alt="" width={23.04} height={12.528} className={`block ${f.urdu}`} />
      </span>
    </Link>
  );
}

const fullMark = "h-[35.552px] w-[38.4px]";
const fullWordmark = "h-[12.876px] w-[116px]";
const fullUrdu = "h-[12.528px] w-[23.04px]";

/** Where the horizontal logo has to give up some room. */
const horizontalFits = {
  /** The Figma size everywhere. */
  full: {
    link: "min-w-[140px] gap-2.5",
    mark: fullMark,
    words: "flex gap-[3px]",
    wordmark: fullWordmark,
    urdu: fullUrdu,
  },
  /** Desktop nav: just the H mark from 1024 to 1279 px, where the links need the room. */
  markOnlyBelowXl: {
    link: "gap-2.5 xl:min-w-[140px]",
    mark: fullMark,
    words: "hidden gap-[3px] xl:flex",
    wordmark: fullWordmark,
    urdu: fullUrdu,
  },
  /**
   * Phone top bar: 80% size below 640 px and 60% below 360 px, so it never
   * touches the language switch, even on a 320 px screen.
   */
  smallerOnPhones: {
    link: "gap-2 max-[360px]:gap-1.5 sm:min-w-[140px] sm:gap-2.5",
    mark: "h-[28.442px] w-[30.72px] max-[360px]:h-[21.331px] max-[360px]:w-[23.04px] sm:h-[35.552px] sm:w-[38.4px]",
    words: "flex gap-[2.4px] max-[360px]:gap-[1.8px] sm:gap-[3px]",
    wordmark:
      "h-[10.301px] w-[92.8px] max-[360px]:h-[7.726px] max-[360px]:w-[69.6px] sm:h-[12.876px] sm:w-[116px]",
    urdu: "h-[10.022px] w-[18.432px] max-[360px]:h-[7.517px] max-[360px]:w-[13.824px] sm:h-[12.528px] sm:w-[23.04px]",
  },
};

/**
 * Logo/Stacked (Figma 3:206): the primary lockup for the hero, About and
 * guide covers. Same vector files as the horizontal logo, at the Figma sizes.
 */
export function LogoStacked({ size = "hero" }: { size?: keyof typeof stackedSizes }) {
  const s = stackedSizes[size];
  return (
    <span className={`flex flex-col items-center ${s.gap}`} role="img" aria-label="Humraah, ہمراہ">
      <LogoMark className={s.mark} />
      <img
        src="/brand/logo-wordmark.svg"
        alt=""
        width={240}
        height={26.64}
        className={`block ${s.wordmark}`}
      />
      <img src="/brand/logo-urdu.svg" alt="" width={69.12} height={37.584} className={`block ${s.urdu}`} />
    </span>
  );
}

/** Figma sizes: the home hero, the guide cover (28:2282, 33:2734), the admin sign-in and the About hero (30:2444, 33:3140). */
const stackedSizes = {
  hero: {
    gap: "gap-[16.8px]",
    mark: "h-[119.988px] w-[129.6px]",
    wordmark: "h-[26.64px] w-[240px]",
    urdu: "h-[37.584px] w-[69.12px]",
  },
  cover: {
    gap: "gap-[8.68px] lg:gap-[12.6px]",
    mark: "h-[61.994px] w-[66.96px] lg:h-[89.991px] lg:w-[97.2px]",
    wordmark: "h-[13.764px] w-[124px] lg:h-[19.98px] lg:w-[180px]",
    urdu: "h-[19.418px] w-[35.712px] lg:h-[28.188px] lg:w-[51.84px]",
  },
  /** Admin sign-in brand panel (35:3104): the hero size on desktop, smaller on a phone. */
  auth: {
    gap: "gap-[8.68px] lg:gap-[16.8px]",
    mark: "h-[61.994px] w-[66.96px] lg:h-[119.988px] lg:w-[129.6px]",
    wordmark: "h-[13.764px] w-[124px] lg:h-[26.64px] lg:w-[240px]",
    urdu: "h-[19.418px] w-[35.712px] lg:h-[37.584px] lg:w-[69.12px]",
  },
  about: {
    gap: "gap-[11.2px] lg:gap-[13.44px]",
    mark: "h-[79.992px] w-[86.4px] lg:h-[95.99px] lg:w-[103.68px]",
    wordmark: "h-[17.76px] w-[160px] lg:h-[21.312px] lg:w-[192px]",
    urdu: "h-[25.056px] w-[46.08px] lg:h-[30.067px] lg:w-[55.296px]",
  },
};

/** Logo/Mark: coral left stem, sage right stem. Minimum 28 px tall. */
export function LogoMark({ className = "h-[35.552px] w-[38.4px]" }: { className?: string }) {
  return (
    <img src="/brand/logo-mark.svg" alt="" width={38.4} height={35.552} className={`block ${className}`} />
  );
}
