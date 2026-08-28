import { copy } from "@/copy";

/**
 * Embeds Umami's public "share" dashboard on /statistik. Renders nothing until
 * NEXT_PUBLIC_UMAMI_SHARE_URL is set (enable Share URL in Umami Cloud → paste the
 * link). The share link is meant to be public, so it's a NEXT_PUBLIC_ env.
 *
 * cloud.umami.is is allowlisted in the CSP `frame-src` (middleware.ts). If Umami's
 * share page ever refuses framing (X-Frame-Options), the iframe goes blank — the
 * always-visible "Buka dashboard Umami →" link below is the graceful fallback.
 */
export function UmamiEmbed({ url }: { url?: string }) {
  if (!url) return null;

  return (
    <section className="mt-10">
      <h2 className="font-display text-sm font-semibold uppercase tracking-wide text-tinta-redup">
        {copy.statistik.trafikJudul}
      </h2>
      <p className="mt-1 text-sm text-tinta-redup">{copy.statistik.trafikSub}</p>

      <div className="mt-3 overflow-hidden rounded-xl border border-garis bg-kertas-1 shadow-kartu">
        <iframe
          src={url}
          title={copy.statistik.trafikJudul}
          loading="lazy"
          className="block h-[640px] w-full border-0 bg-kertas-1"
        />
      </div>

      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-2 inline-block text-sm text-tinta-redup hover:text-tinta hover:underline"
      >
        {copy.statistik.trafikBuka}
      </a>
    </section>
  );
}
