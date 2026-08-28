import { JelajahSkeleton, SkeletonShell } from "@/components/Skeleton";

// Safe: /jelajah has no notFound() and no child segments.
export default function Loading() {
  return (
    <SkeletonShell>
      <JelajahSkeleton />
    </SkeletonShell>
  );
}
