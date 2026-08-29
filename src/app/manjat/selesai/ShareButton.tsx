"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/Button";
import { copy } from "@/copy";

function slug(s: string) {
  return (
    s
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "kartu"
  );
}

/**
 * Share the moment. On desktop (fine pointer) the button SAVES the currently-chosen
 * OG image (the ratio + Screenshot/Logo picked in the ShareCard). On touch devices it
 * opens the native share sheet for the listing link; copy-link is the universal fallback.
 */
export function ShareButton({
  url,
  text,
  imageUrl,
  nama,
  rank,
}: {
  url: string;
  text: string;
  imageUrl?: string | null;
  nama?: string;
  rank?: number;
}) {
  const [status, setStatus] = useState<"idle" | "working" | "saved" | "copied">("idle");
  // Touch-primary → share sheet; otherwise (desktop) → download the card. Resolved
  // after mount so SSR and the first client render agree (no hydration mismatch).
  const [isTouch, setIsTouch] = useState(false);
  useEffect(() => {
    setIsTouch(window.matchMedia?.("(pointer: coarse)").matches ?? false);
  }, []);

  const flash = (s: "saved" | "copied") => {
    setStatus(s);
    setTimeout(() => setStatus("idle"), 2000);
  };

  async function copyLink() {
    const shareUrl = new URL(url, window.location.origin).toString();
    await navigator.clipboard.writeText(shareUrl);
    flash("copied");
  }

  async function downloadImage(src: string) {
    setStatus("working");
    try {
      const res = await fetch(src);
      const blob = await res.blob();
      const objectUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = objectUrl;
      a.download = `panjat-${slug(nama ?? "")}${rank ? `-${rank}` : ""}.png`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(objectUrl);
      flash("saved");
    } catch {
      // never fail silently — fall back to copying the link
      await copyLink().catch(() => setStatus("idle"));
    }
  }

  const wantsDownload = !isTouch && Boolean(imageUrl);

  async function onClick() {
    if (wantsDownload && imageUrl) return downloadImage(imageUrl);
    const shareUrl = new URL(url, window.location.origin).toString();
    if (isTouch && navigator.share) {
      try {
        await navigator.share({ title: "Panjat", text, url: shareUrl });
        return;
      } catch {
        /* user cancelled — fall through to copy */
      }
    }
    await copyLink();
  }

  const label =
    status === "working"
      ? copy.momen.mengunduh
      : status === "saved"
        ? copy.momen.tersimpan
        : status === "copied"
          ? copy.momen.tautanDisalin
          : wantsDownload
            ? copy.momen.unduh
            : copy.momen.bagikan;

  return (
    <Button onClick={onClick} disabled={status === "working"} className="w-full">
      {label}
    </Button>
  );
}
