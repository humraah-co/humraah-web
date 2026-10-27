"use client";

import { buttonStyles } from "@/components/ui/Button";
import { ADMIN_HOME } from "@/lib/admin/paths";

/** A workspace page failed. English, no technical details; Next.js records them on the server. */
export default function AdminError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-3 px-4 py-16 text-center lg:py-24">
      <h1 className="text-h1">Sorry, this page isn&apos;t working</h1>
      <p className="text-body-m text-muted">It&apos;s not you. Please try again in a moment.</p>
      <div className="mt-3 flex flex-wrap justify-center gap-3">
        <button type="button" onClick={reset} className={buttonStyles.primary}>
          Try again
        </button>
        {/* A plain link: a full page load, so a broken workspace state is cleared. */}
        <a href={ADMIN_HOME} className={buttonStyles.secondary}>
          Back to the dashboard
        </a>
      </div>
    </div>
  );
}
