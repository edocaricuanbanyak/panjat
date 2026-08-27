import type { Metadata } from "next";
import { PageShell } from "@/components/PageShell";
import { copy } from "@/copy";

export const metadata: Metadata = { title: copy.privasi.metaTitle };

// PageShell fetches categories for the site-wide Manjat modal → render per request.
export const dynamic = "force-dynamic";

// Draft aligned with UU PDP (§18.7). Requires legal review before public launch.
export default function PrivasiPage() {
  return (
    <PageShell>
      <h1
        className="font-display text-3xl font-bold text-tinta sm:text-4xl"
        style={{ fontStretch: "125%" }}
      >
        {copy.privasi.judul}
      </h1>
      <div className="mt-4 flex max-w-xl flex-col gap-3 text-sm text-tinta-redup">
        {copy.privasi.butir.map(([tebal, teks]) => (
          <p key={tebal}>
            <span className="text-tinta">{tebal}</span>
            {teks}
          </p>
        ))}
        <p className="text-xs">{copy.privasi.draf}</p>
      </div>
    </PageShell>
  );
}
