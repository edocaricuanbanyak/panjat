/**
 * Skeleton placeholders shown while a force-dynamic page streams in. Shapes
 * mirror the real components (ListingCard rows, StatTile cards) so the swap to
 * content doesn't jump. The `.skeleton` class (globals.css) does the pulse and
 * is auto-stilled under prefers-reduced-motion.
 *
 * SkeletonShell reproduces PageShell's frame WITHOUT its DB awaits, so a
 * route-level loading.tsx can render instantly (PageShell itself is async).
 */

/** One pulsing block. Caller sets size + rounding via className. */
export function Skeleton({ className = "" }: { className?: string }) {
  return <span aria-hidden className={`skeleton block ${className}`} />;
}

/** Lightweight, non-async copy of PageShell's outer frame for loading.tsx. */
export function SkeletonShell({ children }: { children: React.ReactNode }) {
  return (
    <main
      aria-busy
      className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-4 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-2 sm:px-5 sm:pt-4"
    >
      <div className="sticky top-0 z-30 -mx-4 border-b border-garis/70 bg-kertas px-4 pt-[env(safe-area-inset-top)] sm:-mx-5 sm:px-5">
        <div className="flex h-14 items-center justify-between">
          <Skeleton className="h-6 w-24 rounded-md" />
          <div className="flex items-center gap-3">
            <Skeleton className="h-5 w-16 rounded" />
            <Skeleton className="h-8 w-24 rounded-lg" />
          </div>
        </div>
      </div>
      <div className="flex-1 pt-4">{children}</div>
    </main>
  );
}

/** A board/list row: #rank · logo · (title + meta) · grip — matches ListingCard. */
function RowSkeleton() {
  return (
    <div className="flex items-center gap-3 rounded-xl px-3 py-3">
      <Skeleton className="h-5 w-6 shrink-0 rounded" />
      <Skeleton className="size-9 shrink-0 rounded-md" />
      <div className="min-w-0 flex-1">
        <Skeleton className="h-4 w-2/5 rounded" />
        <Skeleton className="mt-1.5 h-3 w-3/5 rounded" />
      </div>
      <Skeleton className="h-4 w-16 shrink-0 rounded" />
    </div>
  );
}

/** n simple rows (jelajah results, hari-ini board, arsip list). */
export function ListRowsSkeleton({ n = 8 }: { n?: number }) {
  return (
    <div className="flex flex-col gap-2.5">
      {Array.from({ length: n }, (_, i) => (
        <RowSkeleton key={i} />
      ))}
    </div>
  );
}

/** 3 podium blocks + list rows — the home board. */
export function BoardSkeleton() {
  return (
    <div>
      <div className="grid grid-cols-1 gap-3">
        {Array.from({ length: 3 }, (_, i) => (
          <div key={i} className="rounded-xl border border-garis bg-kertas-1 px-4 py-3.5">
            <div className="flex items-center gap-3">
              <Skeleton className="size-11 shrink-0 rounded-md" />
              <div className="min-w-0 flex-1">
                <Skeleton className="h-5 w-1/2 rounded" />
                <Skeleton className="mt-2 h-3 w-3/4 rounded" />
              </div>
              <Skeleton className="h-4 w-20 shrink-0 rounded" />
            </div>
          </div>
        ))}
      </div>
      <div className="mt-4 flex flex-col gap-2.5">
        {Array.from({ length: 12 }, (_, i) => (
          <RowSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}

/** Home page: hero (title + stat line) + board. Used by the in-page Suspense. */
export function HomeSkeleton() {
  return (
    <div>
      <section className="pt-1 pb-5">
        <Skeleton className="h-11 w-4/5 rounded-lg sm:h-14" />
        <Skeleton className="mt-3 h-5 w-3/5 rounded" />
        <div className="mt-4 flex flex-wrap gap-x-5 gap-y-1.5">
          <Skeleton className="h-5 w-24 rounded" />
          <Skeleton className="h-5 w-28 rounded" />
          <Skeleton className="h-5 w-20 rounded" />
        </div>
        <Skeleton className="mt-5 h-12 w-full rounded-xl" />
      </section>
      <BoardSkeleton />
    </div>
  );
}

/** 8 StatTile cards in the same grid the real page uses. */
export function StatGridSkeleton() {
  return (
    <div className="mt-6 grid grid-cols-2 gap-3">
      {Array.from({ length: 8 }, (_, i) => (
        <div key={i} className="rounded-xl border border-garis bg-kertas-1 p-3.5 shadow-kartu">
          <Skeleton className="h-3 w-24 rounded" />
          <Skeleton className="mt-2 h-5 w-20 rounded" />
          <Skeleton className="mt-1.5 h-3 w-28 rounded" />
        </div>
      ))}
    </div>
  );
}

/** Page-level compositions for the safe segment loading.tsx files. */
export function StatistikSkeleton() {
  return (
    <>
      <Skeleton className="h-9 w-40 rounded-lg sm:h-10" />
      <Skeleton className="mt-3 h-4 w-3/4 rounded" />
      <Skeleton className="mt-2 h-3 w-56 rounded" />
      <StatGridSkeleton />
    </>
  );
}

export function JelajahSkeleton() {
  return (
    <>
      <Skeleton className="mb-5 h-9 w-64 rounded-lg" />
      <div className="flex gap-2">
        <Skeleton className="h-10 flex-1 rounded-lg" />
        <Skeleton className="h-10 w-20 rounded-lg" />
      </div>
      <Skeleton className="mt-8 h-4 w-40 rounded" />
      <div className="mt-3 flex flex-wrap gap-2">
        {Array.from({ length: 8 }, (_, i) => (
          <Skeleton key={i} className="h-8 w-24 rounded-full" />
        ))}
      </div>
    </>
  );
}

/** Dasbor index — the "my listings" list (logo · name/status · grip rows). */
export function DasborListSkeleton({ n = 4 }: { n?: number }) {
  return (
    <div className="mt-6 flex flex-col gap-2.5">
      {Array.from({ length: n }, (_, i) => (
        <div
          key={i}
          className="flex items-center justify-between rounded-xl border border-garis bg-kertas-1 p-4 shadow-baris"
        >
          <div className="min-w-0">
            <Skeleton className="h-4 w-40 rounded" />
            <Skeleton className="mt-1.5 h-3 w-20 rounded" />
          </div>
          <Skeleton className="h-4 w-24 rounded" />
        </div>
      ))}
    </div>
  );
}

/** Dasbor detail — the 6 stat tiles + chart + a couple of section blocks. */
export function DasborListingSkeleton() {
  return (
    <>
      <Skeleton className="h-8 w-56 rounded-lg" />
      <Skeleton className="mt-2 h-3 w-40 rounded" />
      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className="rounded-xl border border-garis bg-kertas-1 p-3.5 shadow-kartu">
            <Skeleton className="h-3 w-20 rounded" />
            <Skeleton className="mt-2 h-5 w-16 rounded" />
          </div>
        ))}
      </div>
      <Skeleton className="mt-6 h-32 w-full rounded-xl" />
      <Skeleton className="mt-6 h-24 w-full rounded-xl" />
    </>
  );
}

export function ArsipSkeleton() {
  return (
    <>
      <Skeleton className="h-9 w-52 rounded-lg sm:h-10" />
      <Skeleton className="mt-3 h-4 w-3/4 rounded" />
      <Skeleton className="mt-6 h-40 w-full rounded-2xl" />
      <Skeleton className="mt-8 h-4 w-40 rounded" />
      <div className="mt-3">
        <ListRowsSkeleton n={6} />
      </div>
    </>
  );
}
