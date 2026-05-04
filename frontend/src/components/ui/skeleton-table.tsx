import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface SkeletonTableProps {
  columns?: number;
  rows?: number;
  className?: string;
  showHeader?: boolean;
  showToolbar?: boolean;
}

export function SkeletonTable({
  columns = 5,
  rows = 5,
  className,
  showHeader = true,
  showToolbar = false,
}: SkeletonTableProps) {
  return (
    <div className={cn("space-y-4", className)}>
      {showToolbar && (
        <div className="flex items-center gap-2">
          <Skeleton className="h-9 w-32 skeleton-shimmer" />
          <Skeleton className="h-9 w-24 skeleton-shimmer" />
        </div>
      )}
      <div className="rounded-md border">
        {showHeader && (
          <div className="flex border-b bg-muted/50 p-4">
            {Array.from({ length: columns }).map((_, i) => (
              <Skeleton
                key={`header-${i}`}
                className="h-4 flex-1 skeleton-shimmer"
                style={{ marginRight: i < columns - 1 ? "1rem" : 0 }}
              />
            ))}
          </div>
        )}
        <div className="divide-y">
          {Array.from({ length: rows }).map((_, rowIndex) => (
            <div key={rowIndex} className="flex items-center p-4">
              {Array.from({ length: columns }).map((_, colIndex) => (
                <Skeleton
                  key={`cell-${rowIndex}-${colIndex}`}
                  className="h-4 flex-1 skeleton-shimmer"
                  style={{ marginRight: colIndex < columns - 1 ? "1rem" : 0 }}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
