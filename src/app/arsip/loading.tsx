import { ArsipSkeleton, SkeletonShell } from "@/components/Skeleton";

// Safe: /arsip has no notFound() and no child segments.
export default function Loading() {
  return (
    <SkeletonShell>
      <ArsipSkeleton />
    </SkeletonShell>
  );
}
