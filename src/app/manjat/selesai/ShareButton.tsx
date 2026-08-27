"use client";

import { useState } from "react";
import { Button } from "@/components/Button";

/** Share the listing page (Web Share API where available, else copy the link). */
export function ShareButton({ url, text }: { url: string; text: string }) {
  const [copied, setCopied] = useState(false);

  async function share() {
    const shareUrl = new URL(url, window.location.origin).toString();
    if (navigator.share) {
      try {
        await navigator.share({ title: "Panjat", text, url: shareUrl });
        return;
      } catch {
        /* user cancelled — fall through to copy */
      }
    }
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <Button onClick={share} className="w-full">
      {copied ? "Tautan disalin ✓" : "Bagikan"}
    </Button>
  );
}
