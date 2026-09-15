"use client";

import { buttonClasses } from "@/components/Button";
import { PoleMark } from "@/components/PoleMark";
import { copy } from "@/copy";

/** Page-level error boundary — a calm retry, never a raw stack trace (R20). */
export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="mx-auto flex min-h-[70vh] w-full max-w-md flex-1 flex-col items-center justify-center px-4 py-16 text-center">
      <PoleMark className="mb-5 h-14 w-6" />
      <h1 className="display-md">
        {copy.sistem.galatJudul}
      </h1>
      <p className="mt-2 text-sm text-tinta-redup">{copy.sistem.galatPesan}</p>
      <div className="mt-6 flex items-center gap-2">
        <button type="button" onClick={reset} className={buttonClasses("primary", "md")}>
          {copy.sistem.cobaLagi}
        </button>
        <a href="/" className={buttonClasses("secondary", "md")}>
          {copy.sistem.kePapan}
        </a>
      </div>
    </main>
  );
}
