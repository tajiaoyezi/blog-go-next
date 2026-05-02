"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Users, MessageSquare, Eye } from "lucide-react";
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

const CHART_COLORS = [
  "var(--color-chart-1)",
  "var(--color-chart-2)",
  "var(--color-chart-3)",
  "var(--color-chart-4)",
  "var(--color-chart-5)",
];

/* ==============================
 * 仪表盘页面
 * ============================== */

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get<DashboardData>("/admin")
      .then((res) => {
        if (res.flag) {
          setData(res.data);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const stats = [
    {
      title: "文章数",
      value: data?.articleCount ?? 0,
      icon: FileText,
    },
    {
      title: "用户数",
      value: data?.userCount ?? 0,
      icon: Users,
    },
    {
      title: "留言数",
      value: data?.messageCount ?? 0,
      icon: MessageSquare,
    },
    {
      title: "访问量",
      value: data?.viewCount ?? 0,
      icon: Eye,
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        加载中...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 统计卡片 */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <stat.icon className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stat.value.toLocaleString()}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 图表区域 */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* 分类文章饼图 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">分类文章统计</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={data?.categoryList ?? []}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label={({ name, percent }) =>
                    `${name ?? ""} ${((percent ?? 0) * 100).toFixed(0)}%`
                  }
                >
                  {(data?.categoryList ?? []).map((_, index) => (
                    <Cell
                      key={index}
                      fill={CHART_COLORS[index % CHART_COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* 7 天访问趋势折线图 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">7 天访问趋势</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={data?.viewList ?? []}>
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
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
