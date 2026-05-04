"use client";

import { useEffect, useState, useTransition } from "react";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Users, MessageSquare, Eye } from "lucide-react";
import { StatsCard } from "@/components/dashboard/stats-card";
import { QuickActions } from "@/components/dashboard/quick-actions";
import { RecentActivities } from "@/components/dashboard/recent-activities";
import { TopArticles } from "@/components/dashboard/top-articles";
import { TodoList } from "@/components/dashboard/todo-list";
import { SkeletonChart } from "@/components/ui/skeleton-chart";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorBoundary } from "@/components/error-boundary";
import {
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

/* ==============================
 * 数据类型定义
 * ============================== */

interface DashboardData {
  articleCount: number;
  userCount: number;
  messageCount: number;
  viewCount: number;
  categoryList: { name: string; value: number }[];
  viewList: { date: string; count: number }[];
}

interface TopArticle {
  id: number;
  title: string;
  viewCount: number;
  commentCount: number;
  likeCount: number;
}

interface TodoItem {
  type: "draft" | "comment" | "message";
  count: number;
  label: string;
  link: string;
}

const CHART_COLORS = [
  "var(--color-chart-1)",
  "var(--color-chart-2)",
  "var(--color-chart-3)",
  "var(--color-chart-4)",
  "var(--color-chart-5)",
];

const TIME_RANGES = [
  { label: "7天", value: 7 },
  { label: "30天", value: 30 },
  { label: "90天", value: 90 },
] as const;

/* ==============================
 * 仪表盘页面
 * ============================== */

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<number>(7);
  const [, startTransition] = useTransition();
  
  // Extended data (may not be available from backend)
  const [topArticles, setTopArticles] = useState<TopArticle[]>([]);
  const [todos, setTodos] = useState<TodoItem[]>([]);
  const [extLoading, setExtLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    // Fetch dashboard data
    startTransition(() => setLoading(true));
    api
      .get<DashboardData>("/admin")
      .then((res) => {
        if (!cancelled && res.flag) {
          startTransition(() => setData(res.data));
        }
      })
      .finally(() => {
        if (!cancelled) startTransition(() => setLoading(false));
      });

    // Fetch extended data
    startTransition(() => setExtLoading(true));
    api
      .get<{ records: TopArticle[] }>("/admin/articles?page=1&size=5&sort=viewCount,desc")
      .then((res) => {
        if (!cancelled && res.flag && res.data?.records) {
          startTransition(() => setTopArticles(res.data.records));
        }
      })
      .catch((err) => {
        console.warn("Failed to fetch top articles:", err);
      });

    Promise.all([
      api.get<{ records: { id: number; status: number }[] }>("/admin/articles?page=1&size=1&status=3"),
      api.get<{ records: { id: number }[] }>("/admin/comments?page=1&size=1"),
      api.get<{ records: { id: number }[] }>("/admin/messages?page=1&size=1"),
    ])
      .then(([draftRes, commentRes, messageRes]) => {
        if (cancelled) return;
        const items: TodoItem[] = [];
        if (draftRes.flag && draftRes.data?.records) {
          items.push({
            type: "draft",
            count: draftRes.data.records.length,
            label: "草稿文章",
            link: "/admin/articles?status=3",
          });
        }
        if (commentRes.flag && commentRes.data?.records) {
          items.push({
            type: "comment",
            count: commentRes.data.records.length,
            label: "待审核评论",
            link: "/admin/comments",
          });
        }
        if (messageRes.flag && messageRes.data?.records) {
          items.push({
            type: "message",
            count: messageRes.data.records.length,
            label: "未读留言",
            link: "/admin/messages",
          });
        }
        startTransition(() => setTodos(items));
      })
      .catch((err) => {
        console.warn("Failed to fetch todo data:", err);
      })
      .finally(() => {
        if (!cancelled) startTransition(() => setExtLoading(false));
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const stats = [
    { title: "文章数", value: data?.articleCount ?? 0, icon: FileText },
    { title: "用户数", value: data?.userCount ?? 0, icon: Users },
    { title: "留言数", value: data?.messageCount ?? 0, icon: MessageSquare },
    { title: "访问量", value: data?.viewCount ?? 0, icon: Eye },
  ];

  const viewTrend =
    data?.viewList && data.viewList.length >= 2
      ? (() => {
          const mid = Math.floor(data.viewList.length / 2);
          const recent = data.viewList.slice(mid).reduce((s, v) => s + v.count, 0);
          const previous = data.viewList.slice(0, mid).reduce((s, v) => s + v.count, 0);
          return previous > 0 ? (recent - previous) / previous : undefined;
        })()
      : undefined;

  const filteredViewList = data?.viewList?.slice(-timeRange) ?? [];

  return (
    <div className="space-y-6">
      {/* 统计卡片 */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => (
          <StatsCard
            key={stat.title}
            title={stat.title}
            value={stat.value}
            icon={stat.icon}
            loading={loading}
            trend={index === 3 ? viewTrend : undefined}
            trendLabel={index === 3 && viewTrend !== undefined ? "较上周" : undefined}
          />
        ))}
      </div>

      {/* 快捷操作 */}
      <QuickActions />

      {/* 双栏：最近动态 + 热门文章 */}
      {/* TODO: 接入真实的最近活动数据（如操作日志 API） */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* <ErrorBoundary>
          <RecentActivities activities={[]} loading={extLoading} />
        </ErrorBoundary> */}
        <ErrorBoundary>
          <TopArticles articles={topArticles} loading={extLoading} />
        </ErrorBoundary>
      </div>

      {/* 访问趋势 + 时间范围 */}
      <ErrorBoundary>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">访问趋势</CardTitle>
            <div className="flex gap-1">
              {TIME_RANGES.map((range) => (
                <Button
                  key={range.value}
                  variant={timeRange === range.value ? "default" : "outline"}
                  size="sm"
                  onClick={() => setTimeRange(range.value)}
                >
                  {range.label}
                </Button>
              ))}
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <SkeletonChart height={300} />
            ) : filteredViewList.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={filteredViewList}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" fontSize={12} />
                  <YAxis fontSize={12} />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="count"
                    name="访问量"
                    stroke="var(--color-chart-1)"
                    strokeWidth={2}
                    dot={{ r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <EmptyState
                icon={Eye}
                title="暂无数据"
                description="暂无访问记录"
                size="sm"
              />
            )}
          </CardContent>
        </Card>
      </ErrorBoundary>

      {/* 分类统计 */}
      <ErrorBoundary>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">分类文章统计</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <SkeletonChart height={300} />
            ) : data?.categoryList && data.categoryList.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={data.categoryList}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    label={({ name, percent }) =>
                      `${name ?? ""} ${((percent ?? 0) * 100).toFixed(0)}%`
                    }
                  >
                    {data.categoryList.map((_, index) => (
                      <Cell
                        key={index}
                        fill={CHART_COLORS[index % CHART_COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <EmptyState
                icon={FileText}
                title="暂无分类"
                description="还没有创建任何分类"
                size="sm"
              />
            )}
          </CardContent>
        </Card>
      </ErrorBoundary>

      {/* 待办提醒 */}
      <ErrorBoundary>
        <TodoList items={todos} loading={extLoading} />
      </ErrorBoundary>
    </div>
  );
}
