import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface SkeletonDetailProps {
  fields?: number;
  className?: string;
  hasImage?: boolean;
}

export function SkeletonDetail({
  fields = 6,
  className,
  hasImage = false,
}: SkeletonDetailProps) {
  return (
    <div className={cn("space-y-6", className)}>
      <Skeleton className="h-8 w-1/3 skeleton-shimmer" />
      {hasImage && (
        <Skeleton className="aspect-video w-full max-w-md rounded-xl skeleton-shimmer" />
      )}
      <div className="space-y-4">
        {Array.from({ length: fields }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-3 w-24 skeleton-shimmer" />
            <Skeleton
              className="h-10 w-full skeleton-shimmer"
              style={{ width: `${60 + (i % 3) * 15}%` }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
