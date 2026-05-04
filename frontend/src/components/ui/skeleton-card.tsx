import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface SkeletonCardProps {
  className?: string;
}

export function SkeletonCard({ className }: SkeletonCardProps) {
  return (
    <Card className={cn("h-[120px]", className)}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <Skeleton className="h-4 w-20 skeleton-shimmer" />
        <Skeleton className="h-4 w-4 rounded-full skeleton-shimmer" />
      </CardHeader>
      <CardContent className="space-y-2">
        <Skeleton className="h-8 w-24 skeleton-shimmer" />
        <Skeleton className="h-3 w-16 skeleton-shimmer" />
      </CardContent>
    </Card>
  );
}
