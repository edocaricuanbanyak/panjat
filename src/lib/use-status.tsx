"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type StatusKind = "sukses" | "galat";
export interface InlineStatus {
  kind: StatusKind;
  msg: string;
}

/**
 * Transient inline status for a single control — the DescEdit "Tersimpan ✓"
 * pattern, generalized. Show a success/error message that auto-clears after
 * `holdMs` (toasts should auto-dismiss in 3–5s). This is deliberately NOT a
 * global toast system: render the returned status right next to the control
 * with <StatusText>, so feedback stays contextual (the app's "no toast spam"
 * ethos).
 */
export function useTransientStatus(holdMs = 4000) {
  const [status, setStatus] = useState<InlineStatus | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clear = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    setStatus(null);
  }, []);

  const show = useCallback(
    (kind: StatusKind, msg: string) => {
      if (timer.current) clearTimeout(timer.current);
      setStatus({ kind, msg });
      timer.current = setTimeout(() => setStatus(null), holdMs);
    },
    [holdMs],
  );

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  return { status, show, clear };
}

/**
 * The matching inline status line. `role="alert"` for failures (assertive, so a
 * screen reader interrupts), `role="status"` for successes (polite). Colored
 * with existing tokens: galat = error red, hidup = live green.
 */
export function StatusText({ status }: { status: InlineStatus | null }) {
  if (!status) return null;
  return (
    <span
      role={status.kind === "galat" ? "alert" : "status"}
      className={`text-xs ${status.kind === "galat" ? "text-galat" : "text-hidup"}`}
    >
      {status.msg}
    </span>
  );
}
