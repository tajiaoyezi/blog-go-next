import { Suspense } from "react";
import ArticleList from "./ArticleList";
import { Skeleton } from "@/components/ui/skeleton";

interface HomePageProps {
  searchParams: Promise<{ categoryId?: string; tagId?: string }>;
}

export default async function HomePage({ searchParams }: HomePageProps) {
  const params = await searchParams;
  const categoryId = params.categoryId ?? null;
  const tagId = params.tagId ?? null;
  const hasFilter = !!(categoryId || tagId);

  return (
    <div>
      <section className="mb-12 text-center">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
          {hasFilter ? "文章筛选" : "欢迎来到我的博客"}
        </h1>
        <p className="mt-4 text-lg text-muted-foreground">
          {hasFilter ? "按条件筛选的文章列表" : "记录技术、分享生活"}
        </p>
      </section>

      <Suspense
        fallback={
          <div className="grid gap-6 md:grid-cols-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-64 rounded-xl" />
            ))}
          </div>
        }
      >
        <ArticleList categoryId={categoryId} tagId={tagId} />
      </Suspense>
    </div>
  );
}
