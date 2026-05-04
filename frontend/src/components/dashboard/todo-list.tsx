"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { FileText, MessageSquare, Mail } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface TodoItem {
  type: "draft" | "comment" | "message";
  count: number;
  label: string;
  link: string;
}

interface TodoListProps {
  items?: TodoItem[];
  loading?: boolean;
}

const typeConfig = {
  draft: { icon: FileText, color: "text-amber-500", bg: "bg-amber-500/10" },
  comment: { icon: MessageSquare, color: "text-blue-500", bg: "bg-blue-500/10" },
  message: { icon: Mail, color: "text-emerald-500", bg: "bg-emerald-500/10" },
};

export function TodoList({ items, loading }: TodoListProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-20 skeleton-shimmer" />
        </CardHeader>
        <CardContent className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full skeleton-shimmer" />
          ))}
        </CardContent>
      </Card>
    );
  }

  if (!items || items.length === 0 || items.every((i) => i.count === 0)) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">待办提醒</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {items
          .filter((item) => item.count > 0)
          .map((item) => {
            const config = typeConfig[item.type];
            return (
              <Link
                key={item.type}
                href={item.link}
                className="flex items-center gap-3 rounded-lg border p-3 hover:bg-muted/50 transition-colors"
              >
                <div className={cn("flex h-10 w-10 items-center justify-center rounded-full", config.bg)}>
                  <config.icon className={cn("size-5", config.color)} />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">{item.label}</p>
                </div>
                <span className="text-lg font-bold">{item.count}</span>
              </Link>
            );
          })}
      </CardContent>
    </Card>
  );
}
