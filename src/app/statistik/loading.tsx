import { SkeletonShell, StatistikSkeleton } from "@/components/Skeleton";

// Safe: /statistik has no notFound() and no child segments, so this route-level
// boundary can't turn a 404 into a soft-200.
export default function Loading() {
  return (
    <SkeletonShell>
      <StatistikSkeleton />
    </SkeletonShell>
  );
}
