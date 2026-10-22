"use client";

import { useState } from "react";
import { MessageCircle, Share2 } from "lucide-react";
import { buttonStyles } from "./Button";

/**
 * "icon": the share button in App bar/Back. Uses the phone's share sheet when
 * there is one, otherwise copies the link.
 * "whatsapp": the "Share on WhatsApp" secondary button on detail pages.
 */
export function ShareButton({
  variant,
  title,
  className = "",
}: {
  variant: "icon" | "whatsapp";
  title?: string;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);

  if (variant === "whatsapp") {
    const onClick = () => {
      const text = `${title ?? document.title} ${window.location.href}`;
      window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank", "noopener,noreferrer");
    };
    return (
      <button type="button" onClick={onClick} className={`${buttonStyles.secondary} ${className}`}>
        <MessageCircle className="size-5" strokeWidth={1.75} aria-hidden="true" />
        Share on WhatsApp
      </button>
    );
  }

  const onShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title: document.title, url });
      } catch {
        // the reader closed the share sheet
      }
      return;
    }
    await navigator.clipboard?.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      type="button"
      onClick={onShare}
      className="flex size-11 shrink-0 items-center justify-center rounded-pill border border-border-soft bg-card hover:bg-blush"
      aria-label={copied ? "Link copied" : "Share this page"}
    >
      <Share2 className="size-5" strokeWidth={1.75} aria-hidden="true" />
      <span className="sr-only" role="status">
        {copied ? "Link copied" : ""}
      </span>
    </button>
  );
}
