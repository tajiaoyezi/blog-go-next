import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, TrendingDown, Minus, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatsCardProps {
  title: string;
  value: number;
  icon: LucideIcon;
  trend?: number;
  trendLabel?: string;
  loading?: boolean;
  className?: string;
}

function formatNumber(value: number): string {
  if (value >= 10000) {
    return `${(value / 10000).toFixed(1)}w`;
  }
  return value.toLocaleString("zh-CN");
}

export function StatsCard({
  title,
  value,
  icon: Icon,
  trend,
  trendLabel,
  loading = false,
  className,
}: StatsCardProps) {
  if (loading) {
    return (
      <Card className={cn("h-[120px]", className)}>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-4 rounded-full" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-8 w-24" />
        </CardContent>
      </Card>
    );
  }

  const hasTrend = trend !== undefined && trend !== null;
  const isPositive = hasTrend && trend > 0;
  const isNegative = hasTrend && trend < 0;

  const TrendIcon = isPositive ? TrendingUp : isNegative ? TrendingDown : Minus;
  const trendColor = isPositive
    ? "text-emerald-600 dark:text-emerald-400"
    : isNegative
      ? "text-red-600 dark:text-red-400"
      : "text-muted-foreground";

  return (
    <Card className={cn("h-[120px]", className)}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <Icon className="size-4 text-muted-foreground" />
      </CardHeader>
      <CardContent className="space-y-1">
        <div className="text-2xl font-bold tracking-tight">{formatNumber(value)}</div>
        {hasTrend && (
          <div className="flex items-center gap-1">
            <TrendIcon className={cn("size-3", trendColor)} />
            <span className={cn("text-xs font-medium", trendColor)}>
              {isPositive ? "+" : ""}
              {(trend * 100).toFixed(1)}%
            </span>
            {trendLabel && (
              <span className="text-xs text-muted-foreground">{trendLabel}</span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
