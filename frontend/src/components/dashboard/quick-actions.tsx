import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, MessageSquare, Settings, ScrollText } from "lucide-react";
import Link from "next/link";

const actions = [
  { label: "写文章", icon: FileText, href: "/admin/articles/editor" },
  { label: "查看评论", icon: MessageSquare, href: "/admin/comments" },
  { label: "站点设置", icon: Settings, href: "/admin/settings" },
  { label: "查看日志", icon: ScrollText, href: "/admin/logs" },
];

export function QuickActions() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">快捷操作</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {actions.map((action) => (
            <Link key={action.label} href={action.href}>
              <Button variant="outline" className="w-full h-auto py-4 flex flex-col gap-2">
                <action.icon className="size-5" />
                <span className="text-xs">{action.label}</span>
              </Button>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
