"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { FileText, MessageSquare, User, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

interface Activity {
  id: string;
  type: "comment" | "article" | "message" | "system";
  title: string;
  description: string;
  time: string;
  link?: string;
}

interface RecentActivitiesProps {
  activities?: Activity[];
  loading?: boolean;
}

const typeIcons = {
  comment: MessageSquare,
  article: FileText,
  message: User,
  system: Settings,
};

const typeColors = {
  comment: "text-blue-500",
  article: "text-emerald-500",
  message: "text-amber-500",
  system: "text-muted-foreground",
};

function formatTime(time: string): string {
  const date = new Date(time);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return "刚刚";
  if (minutes < 60) return `${minutes}分钟前`;
  if (hours < 24) return `${hours}小时前`;
  if (days < 7) return `${days}天前`;
  return date.toLocaleDateString("zh-CN");
}

export function RecentActivities({ activities, loading }: RecentActivitiesProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-24 skeleton-shimmer" />
        </CardHeader>
        <CardContent className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex gap-3">
              <Skeleton className="h-8 w-8 rounded-full skeleton-shimmer" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-3/4 skeleton-shimmer" />
                <Skeleton className="h-3 w-1/2 skeleton-shimmer" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  if (!activities || activities.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">最近动态</CardTitle>
        </CardHeader>
        <CardContent>
          <EmptyState
            icon={Settings}
            title="暂无动态"
            description="最近的活动会显示在这里"
            size="sm"
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">最近动态</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 max-h-[400px] overflow-y-auto">
        {activities.slice(0, 10).map((activity) => {
          const Icon = typeIcons[activity.type];
          return (
            <div key={activity.id} className="flex gap-3">
              <div className={cn("mt-0.5", typeColors[activity.type])}>
                <Icon className="size-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{activity.title}</p>
                <p className="text-xs text-muted-foreground truncate">
                  {activity.description}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {formatTime(activity.time)}
                </p>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
