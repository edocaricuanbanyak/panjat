"use client";

import { useEffect } from "react";
import { track } from "@/lib/analytics";

/**
 * Fires `jelajah_dicari` once per rendered query. Server-rendered results mean
 * the count is known here, so zero-result searches (content gaps) are captured
 * too. Renders nothing.
 */
export function TrackJelajahSearch({ query, jumlah }: { query: string; jumlah: number }) {
  useEffect(() => {
    if (!query) return;
    track("jelajah_dicari", { query, jumlah_hasil: jumlah, ada_hasil: jumlah > 0 });
  }, [query, jumlah]);
  return null;
}
