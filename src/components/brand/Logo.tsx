/* eslint-disable @next/next/no-img-element -- tiny static SVGs; next/image adds nothing here */
import Link from "next/link";

/**
 * Logo/Horizontal from Figma (node 3:216): the H mark beside the HUMRAAH
 * wordmark with ہمراہ centred underneath. All three parts are the exact
 * vector files exported from the Figma file (public/brand).
 */
export function LogoHorizontal({ href = "/" }: { href?: string }) {
  return (
    <Link href={href} aria-label="Humraah home" className="flex min-w-[140px] shrink-0 items-center gap-2.5">
      <LogoMark />
      <span className="flex flex-col items-center gap-[3px]">
        <img
          src="/brand/logo-wordmark.svg"
          alt=""
          width={116}
          height={12.876}
          className="block h-[12.876px] w-[116px]"
        />
        <img
          src="/brand/logo-urdu.svg"
          alt=""
          width={23.04}
          height={12.528}
          className="block h-[12.528px] w-[23.04px]"
        />
      </span>
    </Link>
  );
}

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

/** Figma sizes: the home hero, the guide cover (28:2282, 33:2734) and the About hero (30:2444, 33:3140). */
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
