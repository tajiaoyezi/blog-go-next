import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface SkeletonChartProps {
  className?: string;
  height?: number;
}

export function SkeletonChart({ className, height = 300 }: SkeletonChartProps) {
  return (
    <Card className={cn(className)}>
      <CardHeader>
        <Skeleton className="h-5 w-32 skeleton-shimmer" />
      </CardHeader>
      <CardContent>
        <div
          className="relative w-full rounded-md bg-muted"
          style={{ height }}
        >
          <Skeleton className="absolute inset-0 skeleton-shimmer" />
          <div className="absolute inset-0 flex items-end justify-around px-8 pb-8">
            {Array.from({ length: 7 }).map((_, i) => (
              <Skeleton
                key={i}
                className="w-8 rounded-t-md skeleton-shimmer"
                style={{
                  height: `${30 + (i % 5) * 15}%`,
                }}
              />
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
