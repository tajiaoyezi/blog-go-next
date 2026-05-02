"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-3xl font-bold">关于</h1>

      <Card className="mt-8">
        <CardHeader>
          <CardTitle>关于本站</CardTitle>
        </CardHeader>
        <CardContent className="prose prose-neutral dark:prose-invert max-w-none">
          <p>
            欢迎来到我的个人博客！这里记录技术学习、项目经验和生活点滴。
          </p>
          <p>
            本站使用 Go + Next.js 构建，前端基于 TailwindCSS 和 shadcn/ui。
          </p>
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>关于我</CardTitle>
        </CardHeader>
        <CardContent className="prose prose-neutral dark:prose-invert max-w-none">
          <p>一个热爱技术的全栈开发者。</p>
          <ul>
            <li>后端: Go / Java / Node.js</li>
            <li>前端: React / Next.js / Vue</li>
            <li>其他: Docker / Kubernetes / CI/CD</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
