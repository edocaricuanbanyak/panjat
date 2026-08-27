"use client";

import { usePathname, useSearchParams } from "next/navigation";
import posthog from "posthog-js";
import { PostHogProvider as PHProvider } from "posthog-js/react";
import { Suspense, useEffect } from "react";

const KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY;
const HOST = process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://us.i.posthog.com";

/**
 * Product analytics (PRD "Prinsip Penggunaan AI" adjacent; the PRD's chosen tool).
 * Manual $pageview on route change + $pageleave (kept on) is what PostHog needs to
 * derive session duration and bounce rate. No-ops entirely without a key, so dev
 * and CI never phone home. Privacy-minded: respects DNT, no session recording,
 * anonymous events don't create person profiles.
 */
function PageviewTracker() {
  const pathname = usePathname();
  const search = useSearchParams();
  useEffect(() => {
    if (!KEY) return;
    const qs = search.toString();
    posthog.capture("$pageview", {
      $current_url: window.location.origin + pathname + (qs ? `?${qs}` : ""),
    });
  }, [pathname, search]);
  return null;
}

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (!KEY || (posthog as unknown as { __loaded?: boolean }).__loaded) return;
    posthog.init(KEY, {
      api_host: HOST,
      capture_pageview: false, // captured manually on navigation below
      capture_pageleave: true, // needed for session time + bounce rate
      person_profiles: "identified_only",
      respect_dnt: true,
      disable_session_recording: true,
    });
  }, []);

  if (!KEY) return <>{children}</>;
  return (
    <PHProvider client={posthog}>
      <Suspense fallback={null}>
        <PageviewTracker />
      </Suspense>
      {children}
    </PHProvider>
  );
}
