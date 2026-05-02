"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/lib/api";

interface Tag {
  id: number;
  tagName: string;
  articleCount: number;
}

/** 根据文章数量计算标签大小等级 (0-4) */
function getSizeLevel(count: number, maxCount: number): number {
  if (maxCount <= 0) return 0;
  const ratio = count / maxCount;
  if (ratio > 0.8) return 4;
  if (ratio > 0.6) return 3;
  if (ratio > 0.4) return 2;
  if (ratio > 0.2) return 1;
  return 0;
}

const sizeClasses = [
  "text-xs px-2 py-0.5",
  "text-sm px-2.5 py-0.5",
  "text-base px-3 py-1",
  "text-lg px-3.5 py-1",
  "text-xl px-4 py-1.5",
];

export default function TagsPage() {
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get<Tag[]>("/tags")
      .then((res) => {
        if (res.flag && res.data) {
          setTags(res.data);
        }
      })
      .catch((err) => setError(err instanceof Error ? err.message : "加载失败"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">标签</h1>
        <div className="flex flex-wrap gap-3">
          {Array.from({ length: 12 }).map((_, i) => (
            <Skeleton key={i} className="h-8 w-20 rounded-full" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
        <p>加载失败: {error}</p>
      </div>
    );
  }

  const maxCount = Math.max(...tags.map((t) => t.articleCount), 1);

  return (
    <div>
      <h1 className="text-3xl font-bold">标签</h1>
      <p className="mt-2 text-muted-foreground">
        共 {tags.length} 个标签
      </p>

      <div className="mt-8 flex flex-wrap items-center gap-3">
        {tags.map((tag) => {
          const level = getSizeLevel(tag.articleCount, maxCount);
          return (
            <a key={tag.id} href={`/?tagId=${tag.id}`}>
              <Badge
                variant="secondary"
                className={`cursor-pointer transition-transform hover:scale-105 ${sizeClasses[level]}`}
              >
                {tag.tagName}
                <span className="ml-1 opacity-60">({tag.articleCount})</span>
              </Badge>
            </a>
          );
        })}

        {tags.length === 0 && (
          <p className="w-full text-center text-muted-foreground">暂无标签</p>
        )}
      </div>
    </div>
  );
}
