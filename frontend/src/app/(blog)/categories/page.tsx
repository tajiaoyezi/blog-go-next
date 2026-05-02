"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/lib/api";

interface Category {
  id: number;
  categoryName: string;
  articleCount: number;
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get<Category[]>("/categories")
      .then((res) => {
        if (res.flag && res.data) {
          setCategories(res.data);
        }
      })
      .catch((err) => setError(err instanceof Error ? err.message : "加载失败"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">分类</h1>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
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

  return (
    <div>
      <h1 className="text-3xl font-bold">分类</h1>
      <p className="mt-2 text-muted-foreground">
        共 {categories.length} 个分类
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {categories.map((cat) => (
          <Link key={cat.id} href={`/?categoryId=${cat.id}`}>
            <Card className="transition-shadow hover:shadow-lg">
              <CardHeader>
                <CardTitle className="text-lg">{cat.categoryName}</CardTitle>
                <CardDescription>
                  {cat.articleCount} 篇文章
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>
        ))}

        {categories.length === 0 && (
          <p className="col-span-full text-center text-muted-foreground">
            暂无分类
          </p>
        )}
      </div>
    </div>
  );
}
