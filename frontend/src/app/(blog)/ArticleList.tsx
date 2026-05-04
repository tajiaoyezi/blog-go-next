"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import Image from "next/image";
import { api } from "@/lib/api";

interface TagBrief {
  id: number;
  tagName: string;
}

interface Article {
  id: number;
  articleCover: string;
  articleTitle: string;
  articleContent: string;
  isTop: boolean;
  type: number;
  createTime: string;
  categoryName: string;
  tagVOList: TagBrief[];
}

interface PageResult {
  records: Article[];
  count: number;
}

interface ArticleListProps {
  categoryId?: string | null;
  tagId?: string | null;
}

const PAGE_SIZE = 10;

export default function ArticleList({ categoryId, tagId }: ArticleListProps = {}) {
  const [articles, setArticles] = useState<Article[]>([]);
  const [total, setTotal] = useState(0);
  const [current, setCurrent] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const requestIdRef = useRef(0);

  // 过滤条件变化时重置页码并请求
  useEffect(() => {
    setCurrent(1);
    fetchArticles(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoryId, tagId]);

  function fetchArticles(page: number) {
    // 递增请求 ID，忽略过期响应
    const thisRequest = ++requestIdRef.current;

    setLoading(true);
    setError("");

    const hasFilter = categoryId || tagId;
    const params = new URLSearchParams({
      current: String(page),
      size: String(PAGE_SIZE),
    });
    if (categoryId) params.set("categoryId", categoryId);
    if (tagId) params.set("tagId", tagId);

    const endpoint = hasFilter
      ? `/articles/condition?${params.toString()}`
      : `/articles?${params.toString()}`;

    api
      .get<PageResult>(endpoint)
      .then((res) => {
        if (thisRequest !== requestIdRef.current) return; // 忽略过期响应
        if (res.flag && res.data) {
          setArticles(res.data.records || []);
          setTotal(res.data.count ?? 0);
        }
      })
      .catch((err: unknown) => {
        if (thisRequest !== requestIdRef.current) return;
        setError(err instanceof Error ? err.message : "加载失败");
      })
      .finally(() => {
        if (thisRequest === requestIdRef.current) {
          setLoading(false);
        }
      });
  }

  if (loading) {
    return (
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-64 rounded-xl" />
        ))}
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

  if (articles.length === 0) {
    return (
      <p className="text-center text-muted-foreground">暂无文章</p>
    );
  }

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {articles.map((article) => (
        <Link key={article.id} href={`/articles/${article.id}`}>
          <Card className="group h-full overflow-hidden transition-shadow hover:shadow-lg">
            {article.articleCover && (
              <div className="aspect-video overflow-hidden">
                <Image
                  src={article.articleCover}
                  alt={article.articleTitle}
                  fill
                  sizes="(max-width: 768px) 100vw, 50vw"
                  className="object-cover transition-transform group-hover:scale-105"
                  loading="lazy"
                />
              </div>
            )}
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                {article.isTop && (
                  <Badge variant="destructive" className="text-xs">
                    置顶
                  </Badge>
                )}
                {article.categoryName && (
                  <Badge variant="secondary" className="text-xs">
                    {article.categoryName}
                  </Badge>
                )}
              </div>
              <CardTitle className="line-clamp-2 text-lg">
                {article.articleTitle}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="line-clamp-3 text-sm text-muted-foreground">
                {article.articleContent?.replace(/[#*`>\-\[\]()]/g, "").slice(0, 200)}
              </p>
              <div className="mt-3 flex items-center justify-between">
                <div className="flex gap-1">
                  {article.tagVOList?.slice(0, 3).map((tag) => (
                    <Badge key={tag.id} variant="outline" className="text-xs">
                      {tag.tagName}
                    </Badge>
                  ))}
                </div>
                <time className="text-xs text-muted-foreground">
                  {article.createTime}
                </time>
              </div>
            </CardContent>
          </Card>
        </Link>
      ))}

      {/* 分页 */}
      {totalPages > 1 && (
        <div className="col-span-full flex items-center justify-center gap-3 pt-4">
          <Button
            variant="outline"
            size="sm"
            disabled={current === 1}
            onClick={() => { const p = current - 1; setCurrent(p); fetchArticles(p); }}
          >
            上一页
          </Button>
          <span className="text-sm text-muted-foreground">
            {current} / {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={current === totalPages}
            onClick={() => { const p = current + 1; setCurrent(p); fetchArticles(p); }}
          >
            下一页
          </Button>
        </div>
      )}
    </div>
  );
}
