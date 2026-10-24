import Link from "next/link";
import { ArrowLeft, X } from "lucide-react";
import { LogoHorizontal } from "@/components/brand/Logo";
import { buttonStyles } from "@/components/ui/Button";
import { ShareButton } from "@/components/ui/ShareButton";

const iconButton =
  "flex size-11 shrink-0 items-center justify-center rounded-pill border border-border-soft bg-card hover:bg-blush";

/**
 * The quiz's own header. Phones: "App bar/Back" (Figma 10:194) with a back
 * link and either an exit (x) or share button. Desktop: logo and "Exit quiz"
 * (Figma 25:1366).
 */
export function QuizHeader({
  title,
  backHref,
  backLabel,
  action,
}: {
  title: string;
  backHref: string;
  backLabel: string;
  action: "exit" | "share";
}) {
  return (
    <header className="sticky top-0 z-40 border-b border-border-soft bg-cream">
      <div className="flex items-center gap-1.5 px-3 py-2 lg:hidden">
        <Link href={backHref} className={iconButton} aria-label={backLabel}>
          <ArrowLeft className="size-5" strokeWidth={1.75} aria-hidden="true" />
        </Link>
        <p className="flex-1 text-label-l">{title}</p>
        {action === "exit" ? (
          <Link href="/" className={iconButton} aria-label="Exit the quiz">
            <X className="size-5" strokeWidth={1.75} aria-hidden="true" />
          </Link>
        ) : (
          <ShareButton variant="icon" />
        )}
      </div>

      <div className="mx-auto hidden max-w-[1440px] items-center justify-between px-20 py-4 lg:flex">
        <LogoHorizontal />
        <Link href="/" className={buttonStyles.secondary}>
          <X className="size-5" strokeWidth={1.75} aria-hidden="true" />
          Exit quiz
        </Link>
      </div>
    </header>
  );
}

/** "Question 1 of 6 · About 2 minutes" and the coral progress bar. */
export function QuizProgress({ label, aside, value }: { label: string; aside?: string; value: number }) {
  return (
    <div className="flex flex-col gap-2.5 lg:gap-5">
      <div className="flex items-center justify-between text-label-s text-muted">
        <p>{label}</p>
        {aside && <p>{aside}</p>}
      </div>
      <div
        role="progressbar"
        aria-label="Quiz progress"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(value * 100)}
        className="h-2 overflow-hidden rounded-pill bg-border-soft"
      >
        <div className="h-full rounded-pill bg-coral" style={{ width: `${value * 100}%` }} />
      </div>
    </div>
  );
}
