import posthog from "posthog-js";

/**
 * Product analytics events (PostHog). ANALYTICS ONLY — never a source of truth
 * for money, CPC, click counts, or ranking. Those stay deterministic and
 * server-side/auditable per the product contracts; these events may be dropped
 * by adblock/DNT and that is acceptable here.
 *
 * Add new events to `Events` so props stay typed and consistent (a small event
 * deck, like the copy deck for text).
 */
type Events = {
  // Jelajah search performed. Zero-result searches are the signal that matters
  // most (content/listing gaps), so `ada_hasil` is captured explicitly.
  jelajah_dicari: { query: string; jumlah_hasil: number; ada_hasil: boolean };
  // Top of the manjat funnel: the modal opened. `express` = a Salip/hero jump
  // straight to pay vs a fresh climb from step 1.
  manjat_dimulai: { express: boolean };
};

export function track<E extends keyof Events>(event: E, props: Events[E]): void {
  if (typeof window === "undefined") return;

  // GTM/GA4 (live in prod): push to dataLayer so a GA4 event tag in GTM can
  // forward it. `?.` guards dev/CI where GTM isn't loaded (no dataLayer).
  const dl = (window as unknown as { dataLayer?: Record<string, unknown>[] }).dataLayer;
  dl?.push({ event, ...props });

  // PostHog (activates when NEXT_PUBLIC_POSTHOG_KEY is set): no-op until loaded.
  if ((posthog as unknown as { __loaded?: boolean }).__loaded) {
    posthog.capture(event, props);
  }
}
