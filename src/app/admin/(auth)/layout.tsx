import { LogoStacked } from "@/components/brand/Logo";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

/**
 * Admin – Login (Figma 35:3104): the blush brand panel beside a centred
 * card. Shared by sign-in, password reset, accepting an invite and "No
 * access". On a phone the brand panel shrinks to a band above the card.
 */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col lg:flex-row">
      <section className="flex flex-col items-center justify-center gap-3 overflow-hidden bg-blush px-5 py-8 text-center lg:flex-1 lg:gap-6 lg:p-16">
        <LogoStacked size="auth" />
        <p className="font-script text-[24px] leading-7 lg:text-[30px] lg:leading-8">
          Walking alongside. Growing together.
        </p>
        <p className="max-w-[420px] text-body-s text-muted lg:text-body-m">
          The Humraah team workspace for keeping university and scholarship information accurate and up to
          date.
        </p>
      </section>
      <div className="flex flex-1 justify-center px-4 py-8 lg:items-center lg:px-10">
        <div className="flex w-full max-w-[440px] flex-col gap-3 self-start lg:self-center">
          <div className="flex justify-end">
            <ThemeToggle />
          </div>
          <div className="flex flex-col gap-[18px] rounded-[28px] border border-border-soft bg-card p-6 sm:p-10">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
