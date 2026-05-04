"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { FileText, Eye, MessageSquare, ThumbsUp } from "lucide-react";
import Link from "next/link";

interface TopArticle {
  id: number;
  title: string;
  viewCount: number;
  commentCount: number;
  likeCount: number;
}

interface TopArticlesProps {
  articles?: TopArticle[];
  loading?: boolean;
}

export function TopArticles({ articles, loading }: TopArticlesProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-32 skeleton-shimmer" />
        </CardHeader>
        <CardContent className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="h-6 w-6 rounded-full skeleton-shimmer" />
              <div className="flex-1 space-y-1">
                <Skeleton className="h-4 w-full skeleton-shimmer" />
                <Skeleton className="h-3 w-2/3 skeleton-shimmer" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  if (!articles || articles.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">热门文章</CardTitle>
        </CardHeader>
        <CardContent>
          <EmptyState
            icon={FileText}
            title="暂无文章"
            description="还没有发布任何文章"
            size="sm"
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">热门文章</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {articles.slice(0, 5).map((article, index) => (
          <Link
            key={article.id}
            href={`/admin/articles/editor?id=${article.id}`}
            className="flex items-center gap-3 group">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium">
              {index + 1}
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">
                {article.title}
              </p>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Eye className="size-3" /> {article.viewCount}
                </span>
                <span className="flex items-center gap-1">
                  <MessageSquare className="size-3" /> {article.commentCount}
                </span>
                <span className="flex items-center gap-1">
                  <ThumbsUp className="size-3" /> {article.likeCount}
                </span>
              </div>
            </div>
          </Link>
        ))}
      </CardContent>
    </Card>
  );
}
