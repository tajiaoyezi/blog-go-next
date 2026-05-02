"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/lib/api";

interface ArchiveArticle {
  id: number;
  articleTitle: string;
  createTime: string;
}

interface PageResult {
  records: ArchiveArticle[];
  count: number;
}

/** 按年月分组归档文章 */
function groupByYearMonth(articles: ArchiveArticle[]) {
  const groups: Record<string, ArchiveArticle[]> = {};

  for (const article of articles) {
    const date = new Date(article.createTime);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    if (!groups[key]) {
      groups[key] = [];
    }
    groups[key].push(article);
  }

  return Object.entries(groups).sort(([a], [b]) => b.localeCompare(a));
}

export default function ArchivesPage() {
  const [articles, setArticles] = useState<ArchiveArticle[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get<PageResult>("/articles/archives?current=1&size=50")
      .then((res) => {
        if (res.flag && res.data) {
          setArticles(res.data.records || []);
          setTotal(res.data.count ?? res.data.records?.length ?? 0);
        }
      })
      .catch((err: unknown) => setError(err instanceof Error ? err.message : "加载失败"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">归档</h1>
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-24 w-full rounded-lg" />
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

  const grouped = groupByYearMonth(articles);

  return (
    <div>
      <h1 className="text-3xl font-bold">归档</h1>
      <p className="mt-2 text-muted-foreground">
        共 {total} 篇文章
      </p>

      <div className="mt-8 space-y-10">
        {grouped.map(([yearMonth, items]) => {
          const [year, month] = yearMonth.split("-");
          return (
            <section key={yearMonth}>
              <h2 className="mb-4 text-xl font-semibold">
                {year} 年 {parseInt(month, 10)} 月
              </h2>

              <div className="border-l-2 border-border pl-6">
                {items.map((article) => {
                  const date = new Date(article.createTime);
                  const day = `${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
                  return (
                    <div key={article.id} className="relative mb-4 last:mb-0">
                      <span className="absolute -left-[31px] top-1.5 h-3 w-3 rounded-full border-2 border-primary bg-background" />
                      <div className="flex items-baseline gap-3">
                        <time className="shrink-0 text-sm text-muted-foreground">
                          {day}
                        </time>
                        <Link
                          href={`/articles/${article.id}`}
                          className="text-foreground transition-colors hover:text-primary"
                        >
                          {article.articleTitle}
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          );
        })}

        {grouped.length === 0 && (
          <p className="text-center text-muted-foreground">暂无归档文章</p>
        )}
      </div>
    </div>
  );
}
