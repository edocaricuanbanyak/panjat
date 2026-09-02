"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/Button";
import { copy } from "@/copy";
import { StatusText, useTransientStatus } from "@/lib/use-status";

/** Dashboard site-preview panel with a "Segarkan pratinjau" button (R21, 1×/day). */
export function ScreenshotPanel({
  listingId,
  screenshotUrl,
  nama,
}: {
  listingId: string;
  screenshotUrl: string | null;
  nama: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const { status, show } = useTransientStatus();

  async function refresh() {
    setBusy(true);
    try {
      const res = await fetch(`/api/dasbor/${listingId}/screenshot`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? copy.error.gagalProses);
      show("sukses", copy.dasbor.pratinjauTersegarkan);
      router.refresh();
    } catch (e) {
      show("galat", e instanceof Error ? e.message : copy.error.gagalProses);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      {screenshotUrl ? (
        // biome-ignore lint/performance/noImgElement: user-captured screenshot, not a static asset
        <img
          src={screenshotUrl}
          alt={copy.listing.pratinjauAlt(nama)}
          width={1200}
          height={800}
          className="w-full rounded-xl border border-garis shadow-kartu"
        />
      ) : (
        <div className="flex h-40 items-center justify-center rounded-xl border border-dashed border-garis bg-kertas-2 text-center text-sm text-tinta-redup">
          {copy.dasbor.belumAdaPratinjau}
        </div>
      )}
      <div className="flex items-center gap-3">
        <Button variant="secondary" size="sm" onClick={refresh} disabled={busy}>
          {busy ? copy.dasbor.menyegarkan : copy.dasbor.segarkan}
        </Button>
        <StatusText status={status} />
      </div>
    </div>
  );
}
