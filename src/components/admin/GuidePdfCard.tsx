"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ExternalLink, FileText, LoaderCircle, Trash2, Upload } from "lucide-react";
import {
  confirmGuideUpload,
  removeGuide,
  requestGuideUpload,
} from "@/app/admin/(portal)/guidance/guides/actions";
import { sendGuideFile } from "@/components/admin/sendGuideFile";
import { buttonStyles } from "@/components/ui/Button";
import { FormAlert, FormNotice } from "@/components/ui/Field";
import {
  GUIDE_MIME,
  formatFileSize,
  guideErrorMessages,
  validateGuideUpload,
  type GuideError,
  type GuideLanguage,
} from "@/lib/guideFiles";

export type CurrentGuide = {
  fileName: string;
  sizeBytes: number;
  /** Already worded, e.g. "9 Nov 2026, 14:05". */
  updated: string;
  uploader: string | null;
  /** The public address of the file. */
  url: string;
};

type Phase = "idle" | "preparing" | "uploading" | "finishing" | "removing";

const names: Record<GuideLanguage, string> = { en: "English", ur: "Urdu" };

/**
 * One of the two guide cards: what is live now, and the buttons to upload or
 * replace it and (for admins and the owner) to remove it. The file goes from
 * the browser straight to Storage; see lib/admin/guideActions.ts. The server
 * checks the person’s role on every step, so hiding Remove here is only a
 * courtesy.
 */
export function GuidePdfCard({
  language,
  current,
  canRemove,
}: {
  language: GuideLanguage;
  current: CurrentGuide | null;
  canRemove: boolean;
}) {
  const router = useRouter();
  const name = names[language];
  const id = `guide-${language}`;
  const input = useRef<HTMLInputElement>(null);
  const cancelUpload = useRef<(() => void) | null>(null);
  const cancelled = useRef(false);
  const cancelRemove = useRef<HTMLButtonElement>(null);
  const removeButton = useRef<HTMLButtonElement>(null);
  const uploadButton = useRef<HTMLButtonElement>(null);

  const [phase, setPhase] = useState<Phase>("idle");
  const [percent, setPercent] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const busy = phase !== "idle";

  // Into the confirmation when it opens, and back to Remove when it closes.
  useEffect(() => {
    if (confirming) cancelRemove.current?.focus();
  }, [confirming]);

  const problem = (code: GuideError) => setError(guideErrorMessages[code]);

  async function upload(file: File) {
    setError(null);
    setNotice(null);
    const request = { language, fileName: file.name, size: file.size, type: file.type };
    const valid = validateGuideUpload(request);
    if (!valid.ok) return problem(valid.error);

    cancelled.current = false;
    setPercent(0);
    setPhase("preparing");
    try {
      const started = await requestGuideUpload(request);
      if (!started.ok) return problem(started.error);

      setPhase("uploading");
      const sending = sendGuideFile(started.signedUrl, file, setPercent);
      cancelUpload.current = sending.cancel;
      const sent = await sending.done;
      cancelUpload.current = null;
      if (!sent.ok) {
        if (cancelled.current) return setNotice("Upload cancelled. The current guide is unchanged.");
        return problem(sent.error);
      }

      setPhase("finishing");
      const done = await confirmGuideUpload({ language, path: started.path, fileName: file.name });
      if (!done.ok) return problem(done.error);
      setNotice(
        `${current ? "Replaced" : "Uploaded"}: ${done.fileName} (${formatFileSize(done.size)}). It is now on the Guidance page.`,
      );
      router.refresh();
    } catch {
      // A dropped connection while asking the server, or the page being offline.
      problem("network");
    } finally {
      setPhase("idle");
      cancelUpload.current = null;
    }
  }

  async function remove() {
    setError(null);
    setNotice(null);
    setConfirming(false);
    setPhase("removing");
    try {
      const result = await removeGuide({ language });
      if (!result.ok) return problem(result.error);
      setNotice(`The ${name} PDF was removed. The Guidance page shows “Coming soon” again.`);
      router.refresh();
      // Remove is gone now; keep the keyboard where it was.
      window.setTimeout(() => uploadButton.current?.focus(), 100);
    } catch {
      problem("network");
    } finally {
      setPhase("idle");
    }
  }

  const status =
    phase === "preparing"
      ? "Getting ready…"
      : phase === "uploading"
        ? `Uploading… ${percent}%`
        : phase === "finishing"
          ? "Checking the file…"
          : phase === "removing"
            ? "Removing…"
            : "";

  return (
    <section
      aria-labelledby={`${id}-title`}
      className="flex min-w-0 flex-col gap-4 rounded-[20px] border border-border-soft bg-card p-4 sm:p-5"
    >
      <div className="flex items-start gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-tint-coral">
          <FileText className="size-5" strokeWidth={1.75} aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <h2 id={`${id}-title`} className="text-label-l">
            {name} PDF
          </h2>
          <p className="text-caption text-muted">
            {current ? "Live on the Guidance page" : "Nothing uploaded. The page shows “Coming soon”."}
          </p>
        </div>
      </div>

      {current && (
        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-body-s">
          <dt className="text-muted">File</dt>
          <dd className="min-w-0 break-words" dir="auto">
            {current.fileName}
          </dd>
          <dt className="text-muted">Size</dt>
          <dd>{formatFileSize(current.sizeBytes)}</dd>
          <dt className="text-muted">Updated</dt>
          <dd>{current.updated}</dd>
          <dt className="text-muted">By</dt>
          <dd className="min-w-0 break-words">{current.uploader ?? "A former team member"}</dd>
        </dl>
      )}

      <input
        ref={input}
        id={`${id}-file`}
        type="file"
        accept={`${GUIDE_MIME},.pdf`}
        className="hidden"
        tabIndex={-1}
        aria-label={`Choose the ${name} PDF`}
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = "";
          if (file) void upload(file);
        }}
      />

      <div className="flex flex-wrap gap-2.5">
        <button
          ref={uploadButton}
          type="button"
          disabled={busy}
          onClick={() => input.current?.click()}
          aria-describedby={`${id}-help`}
          className={`${buttonStyles.primary} cursor-pointer disabled:cursor-not-allowed disabled:opacity-70`}
        >
          <Upload className="size-5 shrink-0" strokeWidth={1.75} aria-hidden="true" />
          {current ? "Replace PDF" : "Upload PDF"}
        </button>
        {current && (
          <a href={current.url} target="_blank" rel="noopener noreferrer" className={buttonStyles.secondary}>
            Open current file
            <ExternalLink className="size-5 shrink-0" strokeWidth={1.75} aria-hidden="true" />
            <span className="sr-only">(opens in a new tab)</span>
          </a>
        )}
        {current && canRemove && !confirming && (
          <button
            ref={removeButton}
            type="button"
            disabled={busy}
            onClick={() => setConfirming(true)}
            className={`${buttonStyles.text} cursor-pointer gap-1.5 disabled:cursor-not-allowed disabled:opacity-70`}
          >
            <Trash2 className="size-4 shrink-0" strokeWidth={1.75} aria-hidden="true" />
            Remove
            <span className="sr-only"> the {name} PDF</span>
          </button>
        )}
      </div>
      <p id={`${id}-help`} className="text-caption text-muted">
        A PDF, 25 MB at most.
      </p>

      {confirming && (
        <div
          role="group"
          aria-labelledby={`${id}-confirm`}
          className="flex flex-col gap-3 rounded-2xl bg-tint-coral p-3.5"
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              setConfirming(false);
              requestAnimationFrame(() => removeButton.current?.focus());
            }
          }}
        >
          <p id={`${id}-confirm`} className="text-body-s">
            Remove the {name} PDF? Visitors will see “Coming soon” instead of the download until a new one is
            uploaded.
          </p>
          <div className="flex flex-wrap gap-2.5">
            <button
              type="button"
              onClick={() => void remove()}
              className={`${buttonStyles.primary} cursor-pointer`}
            >
              Yes, remove it
            </button>
            <button
              ref={cancelRemove}
              type="button"
              onClick={() => {
                setConfirming(false);
                requestAnimationFrame(() => removeButton.current?.focus());
              }}
              className={`${buttonStyles.secondary} cursor-pointer`}
            >
              Keep it
            </button>
          </div>
        </div>
      )}

      {busy && (
        <div className="flex flex-col gap-2">
          <p role="status" className="flex items-center gap-2 text-body-s">
            <LoaderCircle
              className="size-4 shrink-0 motion-safe:animate-spin"
              strokeWidth={1.75}
              aria-hidden="true"
            />
            {status}
          </p>
          {phase === "uploading" && (
            <>
              <div
                role="progressbar"
                aria-label={`${name} PDF upload`}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={percent}
                className="h-2 overflow-hidden rounded-pill bg-blush"
              >
                <div className="h-full bg-deep-rose" style={{ width: `${percent}%` }} />
              </div>
              <button
                type="button"
                onClick={() => {
                  cancelled.current = true;
                  cancelUpload.current?.();
                }}
                className={`${buttonStyles.text} cursor-pointer self-start`}
              >
                Cancel upload
              </button>
            </>
          )}
        </div>
      )}
      {error && <FormAlert>{error}</FormAlert>}
      {notice && !busy && <FormNotice>{notice}</FormNotice>}
    </section>
  );
}
