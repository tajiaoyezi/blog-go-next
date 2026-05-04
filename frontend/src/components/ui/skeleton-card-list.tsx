import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface SkeletonCardListProps {
  count?: number;
  className?: string;
}

export function SkeletonCardList({ count = 4, className }: SkeletonCardListProps) {
  return (
    <div className={cn("grid gap-4 sm:grid-cols-2 lg:grid-cols-4", className)}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="space-y-3">
          <Skeleton className="aspect-video w-full rounded-xl skeleton-shimmer" />
          <Skeleton className="h-4 w-3/4 skeleton-shimmer" />
          <Skeleton className="h-3 w-1/2 skeleton-shimmer" />
        </div>
      ))}
    </div>
  );
}
