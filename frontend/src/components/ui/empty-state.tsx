import { type LucideIcon, FileText, MessageSquare, FolderTree, Tags, Search, Inbox } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick?: () => void;
    href?: string;
  };
  className?: string;
  size?: "sm" | "md" | "lg";
}

const sizeConfig = {
  sm: {
    icon: "w-8 h-8",
    title: "text-sm font-medium",
    description: "text-xs",
    button: "h-8 text-xs",
  },
  md: {
    icon: "w-12 h-12",
    title: "text-lg font-semibold",
    description: "text-sm",
    button: "h-9 text-sm",
  },
  lg: {
    icon: "w-16 h-16",
    title: "text-xl font-semibold",
    description: "text-base",
    button: "h-10 text-base",
  },
};

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
  size = "md",
}: EmptyStateProps) {
  const config = sizeConfig[size];

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center py-12 text-center",
        className
      )}
    >
      {Icon && (
        <Icon className={cn("text-muted-foreground", config.icon)} />
      )}
      <h3 className={cn("text-foreground mt-4", config.title)}>{title}</h3>
      {description && (
        <p className={cn("text-muted-foreground mt-2", config.description)}>
          {description}
        </p>
      )}
      {action && (
        <div className="mt-4">
          {action.href ? (
            <Link href={action.href}>
              <Button variant="outline" className={config.button}>
                {action.label}
              </Button>
            </Link>
          ) : (
            <Button
              variant="outline"
              className={config.button}
              onClick={action.onClick}
            >
              {action.label}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

// Compatibility export for existing pages using EmptyStates object
export const EmptyStates = {
  articles: {
    icon: FileText,
    title: "暂无文章",
    description: "还没有发布任何文章",
    action: { label: "写文章", href: "/admin/articles/editor" } as const,
  },
  comments: {
    icon: MessageSquare,
    title: "暂无评论",
    description: "还没有收到任何评论",
    action: { label: "查看文章", href: "/admin/articles" } as const,
  },
  messages: {
    icon: MessageSquare,
    title: "暂无留言",
    description: "还没有收到任何留言",
  },
  talks: {
    icon: FileText,
    title: "暂无说说",
    description: "还没有发布任何说说",
    action: { label: "发布说说", href: "/admin/talks" } as const,
  },
  categories: {
    icon: FolderTree,
    title: "暂无分类",
    description: "还没有创建任何分类",
    action: { label: "创建分类", href: "/admin/categories" } as const,
  },
  tags: {
    icon: Tags,
    title: "暂无标签",
    description: "还没有创建任何标签",
    action: { label: "创建标签", href: "/admin/tags" } as const,
  },
  albums: {
    icon: Inbox,
    title: "暂无相册",
    description: "还没有创建任何相册",
    action: { label: "创建相册", href: "/admin/albums" } as const,
  },
  logs: {
    icon: Inbox,
    title: "暂无日志",
    description: "还没有任何操作日志",
  },
  search: {
    icon: Search,
    title: "未找到结果",
    description: "尝试其他关键词或筛选条件",
  },
};
