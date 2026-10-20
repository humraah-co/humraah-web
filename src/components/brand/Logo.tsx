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

/** Logo/Mark: coral left stem, sage right stem. Minimum 28 px tall. */
export function LogoMark({ className = "h-[35.552px] w-[38.4px]" }: { className?: string }) {
  return (
    <img src="/brand/logo-mark.svg" alt="" width={38.4} height={35.552} className={`block ${className}`} />
  );
}
